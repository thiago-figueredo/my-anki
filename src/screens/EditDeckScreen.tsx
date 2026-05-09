import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "../components/TextInput";
import { Deck } from "../types";

type EditDeckScreenProps = {
  deck: Deck;
  onSave: (name: string) => void;
  onCancel: () => void;
};

export const EditDeckScreen = ({
  deck,
  onSave,
  onCancel,
}: EditDeckScreenProps) => {
  const [name, setName] = useState(deck.name);

  const confirm = (value: string) => {
    const trimmed = value.trim();

    if (trimmed) {
      onSave(trimmed);
    }
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <TextInput
        prompt="Name: "
        value={name}
        onChange={setName}
        onConfirmType={confirm}
        cursorY={2}
        onCancel={onCancel}
      />
      <Text dimColor>Enter save Esc cancel</Text>
    </Box>
  );
};
