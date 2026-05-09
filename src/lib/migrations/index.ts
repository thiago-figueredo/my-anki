import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { db } from "../db";

function readSql(name: string): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(dir, `${name}.sql`), "utf-8");
}

export function runMigrations() {
  const migrations = ["001_create_decks", "002_create_cards"];

  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    ran_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  for (const name of migrations) {
    const row = db
      .query(`SELECT name FROM _migrations WHERE name = $name`)
      .get({ $name: name }) as { name: string } | null;

    if (!row) {
      db.run(readSql(name));
      db.run(`INSERT INTO _migrations (name) VALUES ($name)`, { $name: name });
    }
  }
}
