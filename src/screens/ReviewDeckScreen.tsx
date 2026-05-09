import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Card, Deck, Rating } from "../types";

type ReviewDeckScreenProps = {
  deck: Deck;
  onReviewCard: (card: Card, rating: Rating) => void;
  onBack: () => void;
  onQuit: () => void;
};

const ratingLabels: { key: string; rating: Rating; label: string; color: string }[] = [
  { key: "1", rating: Rating.Again, label: "Again", color: "red" },
  { key: "2", rating: Rating.Hard, label: "Hard", color: "yellow" },
  { key: "3", rating: Rating.Good, label: "Good", color: "green" },
  { key: "4", rating: Rating.Easy, label: "Easy", color: "cyan" },
];

function formatInterval(interval: number): string {
  if (interval === 0) return "<1d";
  if (interval === 1) return "1d";
  if (interval < 30) return `${interval}d`;
  if (interval < 365) return `${Math.round(interval / 30)}mo`;
  return `${(interval / 365).toFixed(1)}y`;
}

function previewIntervals(card: Card): string[] {
  return ratingLabels.map(({ rating }) => {
    let { interval, easeFactor, repetitions } = card;

    if (rating === Rating.Again) {
      interval = 0;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      if (rating === Rating.Hard) {
        interval = Math.max(1, Math.round(interval * 0.8));
      } else if (rating === Rating.Easy) {
        interval = Math.round(interval * 1.3);
      }
    }

    return formatInterval(interval);
  });
}

export const ReviewDeckScreen = ({
  deck,
  onReviewCard,
  onBack,
  onQuit,
}: ReviewDeckScreenProps) => {
  const [dueCards] = useState(() => {
    const now = new Date().toISOString();
    return deck.cards.filter((c) => !c.nextReviewAt || c.nextReviewAt <= now);
  });

  const [reviewIndex, setReviewIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const currentCard = dueCards[reviewIndex];
  const isDone = dueCards.length === 0 || !currentCard;

  useInput((input, key) => {
    if (key.escape || input === "b") {
      onBack();
      return;
    }

    if (input === "q") {
      onQuit();
      return;
    }

    if (isDone) return;

    if (!isAnswerVisible) {
      if (key.return || input === " ") {
        setIsAnswerVisible(true);
      }
      return;
    }

    const match = ratingLabels.find((r) => r.key === input);
    if (match) {
      onReviewCard(currentCard, match.rating);
      if (reviewIndex + 1 >= dueCards.length) {
        onBack();
      } else {
        setReviewIndex((i) => i + 1);
        setIsAnswerVisible(false);
      }
    }
  });

  if (isDone) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>No cards due for review.</Text>
        <Box marginTop={1}>
          <Text dimColor>Esc/b back q quit</Text>
        </Box>
      </Box>
    );
  }

  const intervals = previewIntervals(currentCard);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>
        {deck.name} — {reviewIndex + 1}/{dueCards.length} due
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
        {isAnswerVisible ? (
          <Box gap={2}>
            {ratingLabels.map((r, i) => (
              <Text key={r.key}>
                <Text color={r.color} bold>{r.key}</Text>
                <Text color={r.color}> {r.label}</Text>
                <Text dimColor> ({intervals[i]})</Text>
              </Text>
            ))}
          </Box>
        ) : (
          <Text dimColor>Enter/Space reveal Esc/b back q quit</Text>
        )}
      </Box>
    </Box>
  );
};
