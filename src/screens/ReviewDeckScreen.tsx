import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Deck } from "../types";

type ReviewDeckScreenProps = {
  deck: Deck;
  onBack: () => void;
  onQuit: () => void;
};

export const ReviewDeckScreen = ({
  deck,
  onBack,
  onQuit,
}: ReviewDeckScreenProps) => {
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const currentCard = deck.cards[reviewIndex];
  const keymap = {
    q: onQuit,
    b: onBack,
  };

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    if (keymap[input]) {
      return keymap[input]();
    }

    if (!key.return && input !== " ") {
      return;
    }

    if (!isAnswerVisible) {
      setIsAnswerVisible(true);
      return;
    }

    setReviewIndex((index) => (index + 1) % deck.cards.length);
    setIsAnswerVisible(false);
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>
        {deck.name} {reviewIndex + 1}/{deck.cards.length}
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Front</Text>
        <Text>{currentCard.front}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Back</Text>
        <Text>{isAnswerVisible ? currentCard.back : "..."}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Enter/Space reveal or next Esc/b back q quit</Text>
      </Box>
    </Box>
  );
};
