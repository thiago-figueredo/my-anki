import React from "react";
import { Box, Text, useInput } from "ink";
import { Deck } from "../types";
import { formatDate } from "../lib/format";

type DeckDetailScreenProps = {
  deck: Deck;
  onCreateCard: () => void;
  onImportCards: () => void;
  onSearchCards: () => void;
  onEditDeck: () => void;
  onDeleteDeck: () => void;
  onReview: () => void;
  onBack: () => void;
  onQuit: () => void;
};

export const DeckDetailScreen = ({
  deck,
  onCreateCard,
  onImportCards,
  onSearchCards,
  onEditDeck,
  onDeleteDeck,
  onReview,
  onBack,
  onQuit,
}: DeckDetailScreenProps) => {
  const hasCards = deck.cards.length > 0;
  const now = new Date().toISOString();
  const dueCount = deck.cards.filter(
    (c) => !c.nextReviewAt || c.nextReviewAt <= now,
  ).length;

  const nextReviewAt =
    deck.cards
      .filter((c) => c.nextReviewAt)
      .map((c) => c.nextReviewAt!)
      .sort()[0] ?? null;

  const keyMap = {
    q: onQuit,
    a: onCreateCard,
    i: onImportCards,
    e: onEditDeck,
    s: () => hasCards && onSearchCards(),
    r: () => dueCount > 0 && onReview(),
    b: onBack,
  };

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    if (key.ctrl && input === "d") {
      onDeleteDeck();
      return;
    }

    keyMap[input]?.(key);
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>
        {deck.cards.length} cards — {dueCount} due
      </Text>
      {nextReviewAt && <Text dimColor>next review {formatDate(nextReviewAt)}</Text>}
      <Box marginTop={1} flexDirection="column">
        <Text>a add card</Text>
        <Text>i import cards</Text>
        <Text>e edit deck</Text>
        <Text color={hasCards ? undefined : "gray"}>s search cards</Text>
        <Text color={dueCount > 0 ? undefined : "gray"}>
          r review ({dueCount} due)
        </Text>
        <Text>Ctrl+d delete deck</Text>
        <Text>Esc/b back</Text>
      </Box>
    </Box>
  );
};
