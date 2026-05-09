import { Database } from "bun:sqlite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { runMigrations } from "./migrations";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "database", "sqlite.db");
export const db = new Database(dbPath);
runMigrations();
