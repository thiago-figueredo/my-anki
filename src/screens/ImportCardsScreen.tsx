import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "../components/TextInput";
import { readdirSync, readFileSync, statSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { Card, Deck } from "../types";

type ImportCardsScreenProps = {
  deck: Deck;
  onImportCards: (cards: Pick<Card, "front" | "back">[]) => void;
  onCancel: () => void;
};

enum Mode {
  Choose = "choose",
  File = "file",
  Paste = "paste",
}

const options = [
  { mode: Mode.File, label: "From file" },
  { mode: Mode.Paste, label: "Paste JSON" },
];

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function appendSlashIfDir(path: string): string {
  return isDir(resolve(path)) ? path + "/" : path;
}

function longestCommonPrefix(strings: string[]): string {
  let prefix = strings[0];
  for (const s of strings) {
    while (!s.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
}

function completeFilePath(input: string): string {
  const resolved = resolve(input || ".");

  if (isDir(resolved)) {
    const entries = readdirSync(resolved);
    if (entries.length === 1) {
      return appendSlashIfDir(join(input || ".", entries[0]));
    }
    return input.endsWith("/") || !input ? input : input + "/";
  }

  const dir = dirname(resolved);
  const prefix = basename(input || ".");

  try {
    const entries = readdirSync(dir).filter((e) => e.startsWith(prefix));
    if (entries.length === 0) return input;

    const parentDir = dirname(input || ".");
    if (entries.length === 1) {
      return appendSlashIfDir(join(parentDir, entries[0]));
    }

    const common = longestCommonPrefix(entries);
    if (common.length > prefix.length) {
      return join(parentDir, common);
    }
  } catch {}

  return input;
}

function parseCards(content: string): Pick<Card, "front" | "back">[] {
  const cards = JSON.parse(content);

  if (!Array.isArray(cards)) {
    throw new Error("JSON must be an array of cards");
  }

  for (const card of cards) {
    if (typeof card.front !== "string" || typeof card.back !== "string") {
      throw new Error("Each card must have \"front\" and \"back\" string fields");
    }
  }

  return cards;
}

export const ImportCardsScreen = ({
  deck,
  onImportCards,
  onCancel,
}: ImportCardsScreenProps) => {
  const [mode, setMode] = useState<Mode>(Mode.Choose);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (mode !== Mode.Choose) return;

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }

    if (key.return) {
      setMode(options[selectedIndex].mode);
    }
  });

  const handleFileSubmit = (filePath: string) => {
    const trimmed = filePath.trim();
    if (!trimmed) return;

    try {
      const content = readFileSync(resolve(trimmed), "utf-8");
      onImportCards(parseCards(content));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        setError("File not found");
      } else if (err instanceof SyntaxError) {
        setError("Invalid JSON");
      } else {
        setError(err.message);
      }
    }
  };

  const handlePasteSubmit = (json: string) => {
    const trimmed = json.trim();
    if (!trimmed) return;

    try {
      onImportCards(parseCards(trimmed));
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON");
      } else {
        setError(err.message);
      }
    }
  };

  if (mode === Mode.Choose) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>Import cards into: {deck.name}</Text>
        <Box marginTop={1} flexDirection="column">
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Text key={option.mode} color={isSelected ? "cyan" : undefined}>
                {isSelected ? "> " : "  "}{option.label}
              </Text>
            );
          })}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Enter select  Up/Down navigate  Esc cancel</Text>
        </Box>
      </Box>
    );
  }

  const isFile = mode === Mode.File;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>Import cards into: {deck.name}</Text>
      <TextInput
        prompt={isFile ? "JSON file path: " : "Paste JSON: "}
        value={value}
        onChange={(v) => { setValue(v); setError(null); }}
        onConfirmType={isFile ? handleFileSubmit : handlePasteSubmit}
        onCancel={() => { setValue(""); setError(null); setMode(Mode.Choose); }}
        onTab={isFile ? () => completeFilePath(value) : undefined}
      />
      {error && <Text color="red">{error}</Text>}
      <Text dimColor>{isFile ? "Tab autocomplete  " : ""}Enter import  Esc back</Text>
    </Box>
  );
};
