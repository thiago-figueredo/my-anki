import { Card } from "../types";
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

    return { id: result.id, ...data, createdAt: result.created_at, updatedAt: result.updated_at };
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
}
