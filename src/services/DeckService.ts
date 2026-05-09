import { Deck } from "../types";
import { db } from "../lib/db";

type JoinRow = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  card_id: number | null;
  front: string | null;
  back: string | null;
  card_created_at: string | null;
  card_updated_at: string | null;
};

export class DeckService {
  static list(): Deck[] {
    const rows = db
      .query(
        `SELECT d.id, d.name, d.created_at, d.updated_at, c.id AS card_id, c.front, c.back, c.created_at AS card_created_at, c.updated_at AS card_updated_at
         FROM decks d
         LEFT JOIN cards c ON c.deck_id = d.id
         ORDER BY d.id, c.id`,
      )
      .all() as JoinRow[];

    const decksMap = new Map<number, Deck>();

    for (const row of rows) {
      let deck = decksMap.get(row.id);

      if (!deck) {
        deck = { id: row.id, name: row.name, cards: [], createdAt: row.created_at, updatedAt: row.updated_at };
        decksMap.set(row.id, deck);
      }

      if (row.card_id !== null && row.front !== null && row.back !== null) {
        deck.cards.push({ id: row.card_id, front: row.front, back: row.back, createdAt: row.card_created_at!, updatedAt: row.card_updated_at! });
      }
    }

    return Array.from(decksMap.values());
  }

  static create({ name }: Pick<Deck, "name">): Deck {
    const result = db
      .query(`INSERT INTO decks (name) VALUES ($name) RETURNING id, created_at, updated_at`)
      .get({ $name: name }) as { id: number; created_at: string; updated_at: string };

    return { id: result.id, name, cards: [], createdAt: result.created_at, updatedAt: result.updated_at };
  }

  static update(id: number, name: string): void {
    db.query(
      `UPDATE decks SET name = $name, updated_at = CURRENT_TIMESTAMP WHERE id = $id`,
    ).run({ $id: id, $name: name });
  }
}
