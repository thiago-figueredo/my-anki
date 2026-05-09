import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "../components/TextInput";

type CreateDeckScreenProps = {
  onCreateDeck: (name: string) => void;
  onCancel: () => void;
};

export const CreateDeckScreen = ({
  onCreateDeck,
  onCancel,
}: CreateDeckScreenProps) => {
  const [name, setName] = useState("");

  const confirmDeckName = (value: string) => {
    const trimmedName = value.trim();

    if (trimmedName) {
      onCreateDeck(trimmedName);
    }
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <TextInput
        prompt="Name: "
        value={name}
        onChange={setName}
        onConfirmType={confirmDeckName}

        onCancel={onCancel}
      />
      <Text dimColor>Enter save  Esc cancel</Text>
    </Box>
  );
};
