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

    onCreateCard(card);
    setCard({ front: "", back: "" });
    setActiveField("front");
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>{deck.name}</Text>
      <Box marginTop={1} flexDirection="column">
        <TextInput
          prompt={frontLabel}
          value={card.front}
          onChange={(text) => updateCard("front", text)}
          onConfirmType={confirmFront}
          isActive={activeField === "front"}
          cursorY={3}
          onCancel={onCancel}
        />

        <TextInput
          prompt={backLabel}
          value={card.back}
          onChange={(text) => updateCard("back", text)}
          onConfirmType={confirmBack}
          isActive={activeField === "back"}
          cursorY={4}
          onCancel={onCancel}
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Up/Down switch Enter next/save Esc decks</Text>
      </Box>
    </Box>
  );
};
