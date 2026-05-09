import React, { FC } from "react";
import { Box, Text, useCursor, useInput } from "ink";
import stringWidth from "string-width";

type TextInputProps = {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onConfirmType: (text: string) => void;
  isActive?: boolean;
  cursorY?: number;
};

export const TextInput: FC<TextInputProps> = ({
  prompt,
  value,
  onChange,
  onConfirmType,
  isActive = true,
  cursorY = 0,
}) => {
  const { setCursorPosition } = useCursor();

  useInput(
    (input, key) => {
      if (key.return) {
        onConfirmType(value);
        return;
      }

      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
        return;
      }

      if (!key.ctrl && !key.meta && input) {
        onChange(value + input);
      }
    },
    { isActive },
  );

  if (isActive) {
    setCursorPosition({ x: stringWidth(prompt + value), y: cursorY });
  }

  return (
    <Box>
      <Text>{prompt}</Text>
      <Text>{value}</Text>
    </Box>
  );
};
