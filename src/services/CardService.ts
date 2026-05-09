import { Card, Rating } from "../types";
import { db } from "../lib/db";

export class CardService {
  static create(deckId: number, data: Pick<Card, "front" | "back">): Card {
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

  static review(card: Card, rating: Rating): Card {
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

    db.query(
      `UPDATE cards SET interval = $interval, ease_factor = $easeFactor, repetitions = $repetitions, next_review_at = $nextReviewAt, updated_at = CURRENT_TIMESTAMP WHERE id = $id`,
    ).run({
      $id: card.id,
      $interval: interval,
      $easeFactor: easeFactor,
      $repetitions: repetitions,
      $nextReviewAt: nextReviewAt,
    });

    return { ...card, interval, easeFactor, repetitions, nextReviewAt };
  }
}
