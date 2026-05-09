import React from "react";
import { Box, Text, useInput } from "ink";
import { Deck } from "../types";

type DeckDetailScreenProps = {
  deck: Deck;
  onCreateCard: () => void;
  onSearchCards: () => void;
  onEditDeck: () => void;
  onReview: () => void;
  onBack: () => void;
  onQuit: () => void;
};

export const DeckDetailScreen = ({
  deck,
  onCreateCard,
  onSearchCards,
  onEditDeck,
  onReview,
  onBack,
  onQuit,
}: DeckDetailScreenProps) => {
  const hasCards = deck.cards.length > 0;
  const keyMap = {
    q: onQuit,
    a: onCreateCard,
    e: onEditDeck,
    s: () => hasCards && onSearchCards(),
    r: () => hasCards && onReview(),
    b: onBack,
  };

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    keyMap[input]?.(key);
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>{deck.cards.length} cards</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>a add card</Text>
        <Text>e edit deck</Text>
        <Text color={hasCards ? undefined : "gray"}>s search cards</Text>
        <Text color={hasCards ? undefined : "gray"}>r review</Text>
        <Text>Esc/b back</Text>
      </Box>
    </Box>
  );
};
