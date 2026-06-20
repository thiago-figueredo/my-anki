import { Card, Rating } from "../types";
import { db } from "../lib/db";
import { EvaluationResult } from "./AiTutorService";

export class DuplicateCardError extends Error {
  constructor(public field: "front" | "back", public value: string) {
    super(`A card with this ${field} already exists: "${value}"`);
  }
}

export class CardService {
  private static checkDuplicates(items: Pick<Card, "front" | "back">[]): void {
    if (items.length === 0) return;

    const fronts = items.map((c) => c.front);
    const backs = items.map((c) => c.back);

    const frontPlaceholders = fronts.map(() => "?").join(", ");
    const existingFront = db
      .query(`SELECT front FROM cards WHERE front IN (${frontPlaceholders})`)
      .get(...fronts) as { front: string } | null;

    if (existingFront) {
      throw new DuplicateCardError("front", existingFront.front);
    }

    const backPlaceholders = backs.map(() => "?").join(", ");
    const existingBack = db
      .query(`SELECT back FROM cards WHERE back IN (${backPlaceholders})`)
      .get(...backs) as { back: string } | null;

    if (existingBack) {
      throw new DuplicateCardError("back", existingBack.back);
    }
  }

  static create(deckId: number, data: Pick<Card, "front" | "back">): Card {
    this.checkDuplicates([data]);

    const result = db
      .query(
        `INSERT INTO cards (deck_id, front, back) VALUES ($deckId, $front, $back) RETURNING id, created_at, updated_at`,
      )
      .get({ $deckId: deckId, $front: data.front, $back: data.back }) as {
      id: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: result.id,
      ...data,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewAt: null,
    };
  }

  static createMany(deckId: number, items: Pick<Card, "front" | "back">[]): Card[] {
    if (items.length === 0) return [];

    this.checkDuplicates(items);

    const values = items.map(() => "(?, ?, ?)").join(", ");
    const params = items.flatMap((data) => [deckId, data.front, data.back]);

    const rows = db
      .query(`INSERT INTO cards (deck_id, front, back) VALUES ${values} RETURNING id, front, back, created_at, updated_at`)
      .all(...params) as { id: number; front: string; back: string; created_at: string; updated_at: string }[];

    return rows.map((row) => ({
      id: row.id,
      front: row.front,
      back: row.back,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewAt: null,
    }));
  }

  static update(id: number, data: Pick<Card, "front" | "back">): void {
    db.query(
      `UPDATE cards SET front = $front, back = $back, updated_at = CURRENT_TIMESTAMP WHERE id = $id`,
    ).run({ $id: id, $front: data.front, $back: data.back });
  }

  static delete(id: number): void {
    db.query(`DELETE FROM cards WHERE id = $id`).run({ $id: id });
  }

  static deleteMany(ids: number[]): void {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(", ");
    db.query(`DELETE FROM cards WHERE id IN (${placeholders})`).run(...ids);
  }

  static review(
    card: Card,
    rating: Rating,
    aiData?: { response: string; evaluation: EvaluationResult },
  ): Card {
    let { interval, easeFactor, repetitions } = card;

    if (rating === Rating.Again) {
      repetitions = 0;
      interval = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      easeFactor = easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
      easeFactor = Math.max(1.3, easeFactor);

      if (rating === Rating.Hard) {
        interval = Math.max(1, Math.round(interval * 0.8));
      } else if (rating === Rating.Easy) {
        interval = Math.round(interval * 1.3);
      }

      repetitions += 1;
    }

    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);
    const nextReviewAt = nextReview.toISOString();

    const saveReview = db.transaction(() => {
      db.query(
        `UPDATE cards SET interval = $interval, ease_factor = $easeFactor, repetitions = $repetitions, next_review_at = $nextReviewAt, updated_at = CURRENT_TIMESTAMP WHERE id = $id`,
      ).run({
        $id: card.id,
        $interval: interval,
        $easeFactor: easeFactor,
        $repetitions: repetitions,
        $nextReviewAt: nextReviewAt,
      });

      db.query(
        `INSERT INTO reviews (
          card_id, rating, interval, ease_factor, repetitions, 
          user_response, ai_score, ai_is_correct, ai_feedback_summary, ai_metadata
        ) VALUES (
          $cardId, $rating, $interval, $easeFactor, $repetitions,
          $userResponse, $aiScore, $aiIsCorrect, $aiFeedbackSummary, $aiMetadata
        )`,
      ).run({
        $cardId: card.id,
        $rating: rating,
        $interval: interval,
        $easeFactor: easeFactor,
        $repetitions: repetitions,
        $userResponse: aiData?.response ?? null,
        $aiScore: aiData?.evaluation.score.value ?? null,
        $aiIsCorrect: aiData ? (aiData.evaluation.correctness === "correct") : null,
        $aiFeedbackSummary: aiData?.evaluation.feedback.summary ?? null,
        $aiMetadata: aiData
          ? JSON.stringify({
              issues: aiData.evaluation.feedback.issues,
              correctPoints: aiData.evaluation.feedback.what_was_correct,
              missingPoints: aiData.evaluation.feedback.missing_key_points,
              improvementTips: aiData.evaluation.feedback.suggested_improvement,
            })
          : null,
      });
    });

    saveReview();

    return { ...card, interval, easeFactor, repetitions, nextReviewAt };
  }
}
