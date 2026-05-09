# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A terminal-based Anki clone (spaced repetition flashcard app) built with Bun, React, and Ink (terminal UI framework). Uses SQLite for persistence and implements the SM-2 spaced repetition algorithm.

## Commands

- `bun start` — Run the app (`bun src/main.tsx`)
- `bun run migrate` — Run database migrations (`bun src/migrate.ts`)

No test framework or linter is configured.

## Architecture

**Runtime:** Bun (uses `bun:sqlite` for database access). This is NOT a Node.js project.

**UI layer:** React components rendered to the terminal via [Ink](https://github.com/vadimdemedes/ink). Navigation is screen-based — `App.tsx` holds all state and switches between screens using a `Screen` enum. There is no router; screen transitions are driven by `useState<Screen>`.

**Data flow:** All state lives in `App.tsx` and is passed down as props/callbacks. Services (`CardService`, `DeckService`) are static classes that perform synchronous SQLite operations and return plain objects. The app loads all decks+cards eagerly on startup via `DeckService.list()` (single JOIN query).

**Database:** SQLite file at `src/database/sqlite.db`. Migrations are `.sql` files in `src/lib/migrations/`, tracked in a `_migrations` table. The migration runner (`src/lib/migrations/index.ts`) executes automatically on `db` import — new migrations must be added to the hardcoded array there.

**SM-2 algorithm:** Implemented in `CardService.review()`. The review logic is duplicated in `ReviewDeckScreen.previewIntervals()` for showing interval previews — keep these in sync when modifying the algorithm.

## Conventions

- Use enums for constant values instead of hardcoded strings or string union types.

## Key Patterns

- Card fields use `camelCase` in TypeScript types but `snake_case` in SQLite columns — services handle the mapping manually.
- `useInput` from Ink handles all keyboard input; there are no form libraries.
- `TextInput` is a custom component (`src/components/TextInput.tsx`), not from a library.
- `useMarkSelection` hook (`src/lib/useMarkSelection.ts`) provides multi-select with mark/unmark for list screens.
