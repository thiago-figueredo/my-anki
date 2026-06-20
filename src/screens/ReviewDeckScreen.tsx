import React, { useState } from "react";
import { Box, Newline, Text, useInput } from "ink";
import { Card, Deck, Rating } from "../types";
import Markdown from "../components/Markdown";
import dedent from "dedent";
import { TextInput } from "../components/TextInput";
import { AiTutorService, EvaluationResult } from "../services/AiTutorService";

type ReviewDeckScreenProps = {
  deck: Deck;
  onReviewCard: (
    card: Card,
    rating: Rating,
    aiData?: { response: string; evaluation: EvaluationResult },
  ) => void;
  onBack: () => void;
  onQuit: () => void;
};

const ratingLabels: {
  key: string;
  rating: Rating;
  label: string;
  color: string;
}[] = [
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
    let { interval } = card;
    const { easeFactor, repetitions } = card;

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
  const [isAiMode, setIsAiMode] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const currentCard = dueCards[reviewIndex];
  const isDone = dueCards.length === 0 || !currentCard;

  const handleRating = (rating: Rating) => {
    const aiData =
      isAiMode && evaluation ? { response: userInput, evaluation } : undefined;
    onReviewCard(currentCard, rating, aiData);

    if (reviewIndex + 1 >= dueCards.length) {
      onBack();
      return;
    }

    setReviewIndex((i) => i + 1);
    setIsAnswerVisible(false);
    setUserInput("");
    setEvaluation(null);
    setIsEvaluating(false);
    setEvalError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const [loadingDots, setLoadingDots] = useState("");

  React.useEffect(() => {
    if (!isEvaluating) {
      setLoadingDots("");
      return;
    }
    const interval = setInterval(() => {
      setLoadingDots((dots) => (dots.length >= 3 ? "" : dots + "."));
    }, 300);
    return () => clearInterval(interval);
  }, [isEvaluating]);

  const startAiEvaluation = async (text: string) => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setEvalError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const responseToEvaluate = text.trim() || "(No response provided)";
      const result = await AiTutorService.evaluateResponse({
        question: currentCard.front,
        expectedAnswer: currentCard.back,
        learnerResponse: responseToEvaluate,
        model: "deepseek-v4-flash",
        abortSignal: controller.signal,
      });

      setEvaluation(result);
      setIsAnswerVisible(true);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Silently reset on cancel
        setEvalError(null);
      } else {
        setEvalError(
          error instanceof Error
            ? error.message
            : "Evaluation failed. Please check your connection or API key.",
        );
      }
      setEvaluation(null);
    } finally {
      setIsEvaluating(false);
      abortControllerRef.current = null;
    }
  };

  const cancelEvaluation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsEvaluating(false);
      setEvalError(null);
    }
  };

  useInput(
    (input, key) => {
      if (isEvaluating) {
        if (key.escape || input === "c") {
          cancelEvaluation();
        }
        return;
      }

      if (key.escape || (input === "b" && !isAiMode)) {
        onBack();
        return;
      }

      if (input === "q" && !isAiMode) {
        onQuit();
        return;
      }

      if (isDone) return;

      // Toggle AI Mode
      if (input === "a" && !isAnswerVisible && !isEvaluating) {
        setIsAiMode(!isAiMode);
        return;
      }

      if (!isAiMode) {
        if (!isAnswerVisible) {
          if (key.return || input === " ") {
            setIsAnswerVisible(true);
          }
          return;
        }

        const match = ratingLabels.find((r) => r.key === input);
        if (!match) return;

        handleRating(match.rating);
      } else {
        // AI Mode after evaluation
        if (isAnswerVisible && evaluation) {
          if (key.return || input === " ") {
            handleRating(evaluation.score.value);
            return;
          }

          const match = ratingLabels.find((r) => r.key === input);
          if (match) {
            handleRating(match.rating);
          }
        }
      }
    },
    { isActive: !isAiMode || (isAiMode && (isAnswerVisible || isEvaluating)) },
  );

  if (isDone) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>No cards due for review.</Text>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>Esc/b back</Text>
          <Text dimColor>q quit</Text>
        </Box>
      </Box>
    );
  }

  const intervals = previewIntervals(currentCard);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box justifyContent="space-between">
        <Text dimColor>
          {deck.name} — {reviewIndex + 1}/{dueCards.length} due
        </Text>
        {isAiMode && (
          <Text color="cyan" bold>
            [AI MODE]
          </Text>
        )}
      </Box>

      <Markdown>{dedent`# Front\n${currentCard.front}`}</Markdown>

      {isAiMode && (!isAnswerVisible || isEvaluating) ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">
            Your Response:
          </Text>
          <TextInput
            prompt=""
            value={userInput}
            onChange={setUserInput}
            onConfirmType={startAiEvaluation}
            isActive={!isEvaluating && !isAnswerVisible}
            onCancel={() => setIsAiMode(false)}
          />

          <Newline />

          {isEvaluating && (
            <Box flexDirection="column">
              <Text color="yellow" italic>
                AI is evaluating your response{loadingDots}
              </Text>
              <Text dimColor>Press Esc or &apos;c&apos; to cancel</Text>
            </Box>
          )}

          {evalError && (
            <Text color="red" bold>
              Error: {evalError}
            </Text>
          )}
        </Box>
      ) : isAnswerVisible ? (
        <Markdown>{dedent`# Back\n${currentCard.back}`}</Markdown>
      ) : (
        <Markdown>{dedent`# Back\n...`}</Markdown>
      )}

      {evaluation && (
        <Box
          flexDirection="column"
          marginTop={1}
          borderStyle="round"
          paddingX={1}
          borderColor={
            ratingLabels.find((r) => r.rating === evaluation.score.value)?.color
          }
        >
          <Box gap={1}>
            <Text bold color="cyan">
              AI Score:
            </Text>
            <Text
              color={ratingLabels.find((r) => r.rating === evaluation.score.value)?.color}
              bold
            >
              {evaluation.score.label}
            </Text>
            <Text color={ratingLabels.find((r) => r.rating === evaluation.score.value)?.color}>
              ({evaluation.correctness.replace("_", " ")})
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text italic>{evaluation.feedback.summary}</Text>
          </Box>
          {evaluation.feedback.issues.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold color="yellow">
                Issues:
              </Text>
              {evaluation.feedback.issues.map((issue, i) => (
                <Text key={i}>• {issue}</Text>
              ))}
            </Box>
          )}
          {evaluation.feedback.missing_key_points.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold color="red">
                Missing Points:
              </Text>
              {evaluation.feedback.missing_key_points.map((point, i) => (
                <Text key={i}>• {point}</Text>
              ))}
            </Box>
          )}
          <Box marginTop={1}>
            <Text bold color="green">
              Improvement Tip:
            </Text>
            <Text> {evaluation.feedback.suggested_improvement}</Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1}>
        {isAnswerVisible ? (
          <Box flexDirection="column">
            <Box gap={2}>
              {ratingLabels.map((r, i) => (
                <Text key={r.key}>
                  <Text color={r.color} bold>
                    {r.key}
                  </Text>
                  <Text color={r.color}> {r.label}</Text>
                  <Text dimColor> ({intervals[i]})</Text>
                </Text>
              ))}
            </Box>
            {isAiMode && evaluation && (
              <Box marginTop={1} flexDirection="column">
                <Text dimColor>
                  Press Enter/Space to accept AI score
                </Text>
                <Text dimColor>
                  or press 1-4 to override
                </Text>
              </Box>
            )}
          </Box>
        ) : (
          <Box flexDirection="column">
            {!isAiMode && <Text dimColor>Enter/Space reveal</Text>}
            {!isEvaluating && <Text dimColor>a toggle AI mode</Text>}
            <Text dimColor>Esc/b back</Text>
            <Text dimColor>q quit</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
