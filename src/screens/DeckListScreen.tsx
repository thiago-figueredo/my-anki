import React from "react";
import { Box, Text, useInput } from "ink";
import { Deck } from "../types";

type DeckListScreenProps = {
  decks: Deck[];
  selectedDeckIndex: number;
  onSelectDeck: (index: number) => void;
  onOpenDeck: () => void;
  onCreateDeck: () => void;
  onQuit: () => void;
};

export const DeckListScreen = ({
  decks,
  selectedDeckIndex,
  onSelectDeck,
  onOpenDeck,
  onCreateDeck,
  onQuit,
}: DeckListScreenProps) => {
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
          return (
            <Box key={deck.id} flexDirection="row" gap={1}>
              <Text color={isSelected ? "cyan" : undefined}>
                {isSelected ? "> " : "  "}
                {deck.name} ({deck.cards.length} cards)
              </Text>
              <Text dimColor>
                created {deck.createdAt} | updated {deck.updatedAt}
              </Text>
            </Box>
          );
        })
      )}

      <Box marginTop={1}>
        <Text dimColor>Enter open Up/Down select n new deck Esc/q quit</Text>
      </Box>
    </Box>
  );
};
