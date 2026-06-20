import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "../components/TextInput";
import { Card, CardField, Deck } from "../types";

type CreateCardScreenProps = {
  deck: Deck;
  onCreateCard: (card: Pick<Card, "front" | "back">) => void;
  onCancel: () => void;
};

export const CreateCardScreen = ({
  deck,
  onCreateCard,
  onCancel,
}: CreateCardScreenProps) => {
  const [card, setCard] = useState({ front: "", back: "" });
  const [activeField, setActiveField] = useState<CardField>("front");
  const [error, setError] = useState<string | null>(null);
  const frontLabel = "Front: ";
  const backLabel = "Back: ";

  useInput((_, key) => {
    if (key.upArrow) {
      setActiveField("front");
      return;
    }

    if (key.downArrow) {
      setActiveField("back");
    }
  });

  const updateCard = (field: CardField, text: string) => {
    setCard((previous) => ({ ...previous, [field]: text }));
    setError(null);
  };

  const confirmFront = () => {
    if (card.front.trim()) {
      setActiveField("back");
    }
  };

  const confirmBack = () => {
    if (!card.front.trim() || !card.back.trim()) {
      return;
    }

    try {
      onCreateCard(card);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    setError(null);
    setCard({ front: "", back: "" });
    setActiveField("front");
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>{deck.name}</Text>
      <Box marginTop={1} flexDirection="column">
        {activeField === "front" ? (
          <TextInput
            prompt={frontLabel}
            value={card.front}
            onChange={(text) => updateCard("front", text)}
            onConfirmType={confirmFront}

            onCancel={onCancel}
          />
        ) : (
          <Box>
            <Text>  {frontLabel}</Text>
            <Text>{card.front}</Text>
          </Box>
        )}

        {activeField === "back" ? (
          <TextInput
            prompt={backLabel}
            value={card.back}
            onChange={(text) => updateCard("back", text)}
            onConfirmType={confirmBack}

            onCancel={onCancel}
          />
        ) : (
          <Box>
            <Text>  {backLabel}</Text>
            <Text>{card.back}</Text>
          </Box>
        )}
      </Box>

      {error && <Text color="red">{error}</Text>}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Up/Down switch</Text>
        <Text dimColor>Enter next/save</Text>
        <Text dimColor>Esc decks</Text>
      </Box>
    </Box>
  );
};
