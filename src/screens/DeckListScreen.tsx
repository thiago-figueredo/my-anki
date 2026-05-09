import React from "react";
import { Box, Text, useInput } from "ink";
import { Deck } from "../types";
import { formatDate } from "../lib/format";
import { useMarkSelection, markPrefix } from "../lib/useMarkSelection";

type DeckListScreenProps = {
  decks: Deck[];
  selectedDeckIndex: number;
  onSelectDeck: (index: number) => void;
  onOpenDeck: () => void;
  onCreateDeck: () => void;
  onDeleteDecks: (decks: Deck[]) => void;
  onQuit: () => void;
};

export const DeckListScreen = ({
  decks,
  selectedDeckIndex,
  onSelectDeck,
  onOpenDeck,
  onCreateDeck,
  onDeleteDecks,
  onQuit,
}: DeckListScreenProps) => {
  const { marked, toggle, clear, getMarked } = useMarkSelection();

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      onQuit();
      return;
    }

    if (input === "n") {
      onCreateDeck();
      return;
    }

    if (decks.length === 0) {
      return;
    }

    if (key.upArrow) {
      onSelectDeck(Math.max(0, selectedDeckIndex - 1));
      return;
    }

    if (key.downArrow) {
      onSelectDeck(Math.min(decks.length - 1, selectedDeckIndex + 1));
      return;
    }

    if (key.tab) {
      toggle(decks[selectedDeckIndex].id);
      return;
    }

    if (key.ctrl && input === "d" && marked.size > 0) {
      onDeleteDecks(getMarked(decks));
      clear();
      return;
    }

    if (key.return) {
      onOpenDeck();
    }
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      {decks.length === 0 ? (
        <Text dimColor>No decks yet.</Text>
      ) : (
        decks.map((deck, index) => {
          const isSelected = index === selectedDeckIndex;
          const isMarked = marked.has(deck.id);
          const prefix = markPrefix(isMarked, isSelected);
          return (
            <Box key={deck.id} flexDirection="row" gap={1}>
              <Text color={isSelected ? "cyan" : isMarked ? "yellow" : undefined}>
                {prefix}
                {deck.name} ({deck.cards.length} cards)
              </Text>
              <Text dimColor>
                created {formatDate(deck.createdAt)} | updated {formatDate(deck.updatedAt)}
              </Text>
            </Box>
          );
        })
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Enter open Up/Down select Tab mark{marked.size > 0 ? " Ctrl+d delete marked" : ""} n new deck Esc/q quit
        </Text>
      </Box>
    </Box>
  );
};
