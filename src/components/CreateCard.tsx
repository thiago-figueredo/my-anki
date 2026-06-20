import React, { useState } from "react";
import { Box, useCursor, useInput } from "ink";
import { TextInput } from "./TextInput";

type Card = {
  front: string;
  back: string;
};

type ActiveField = keyof Card | "done";

export const CreateCard = () => {
  const [card, setCard] = useState<Card>({ front: "", back: "" });
  const [activeField, setActiveField] = useState<ActiveField>("front");
  const { setCursorPosition } = useCursor();

  const onChangeCardFront = (text: string) => {
    setCard((previous) => ({ ...previous, front: text }));
  };

  const onConfirmCardFront = () => {
    setActiveField("back");
  };

  const onChangeCardBack = (text: string) => {
    setCard((previous) => ({ ...previous, back: text }));
  };

  const onConfirmCardBack = (text: string) => {
    setCard((previous) => ({ ...previous, back: text }));
    setActiveField("done");
  };

  if (activeField === "done") {
    setCursorPosition({ x: 0, y: 2 });
  }

  useInput(() => {}, { isActive: activeField === "done" });

  return (
    <Box flexDirection="column">
      <TextInput
        prompt="Front: "
        value={card.front}
        onChange={onChangeCardFront}
        onConfirmType={onConfirmCardFront}
        isActive={activeField === "front"}
      />

      <TextInput
        prompt="Back: "
        value={card.back}
        onChange={onChangeCardBack}
        onConfirmType={onConfirmCardBack}
        isActive={activeField === "back"}
      />
    </Box>
  );
};
