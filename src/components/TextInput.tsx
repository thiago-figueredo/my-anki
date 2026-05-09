import React, { FC, useState, useEffect } from "react";
import { Box, Text, useCursor, useInput } from "ink";
import stringWidth from "string-width";

type TextInputProps = {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onConfirmType: (text: string) => void | Promise<void>;
  isActive?: boolean;
  cursorY?: number;
  onCancel?: () => void;
};

export const TextInput: FC<TextInputProps> = ({
  prompt,
  value,
  onChange,
  onConfirmType,
  isActive = true,
  cursorY = 0,
  onCancel,
}) => {
  const { setCursorPosition } = useCursor();
  const [cursor, setCursor] = useState(value.length);

  useEffect(() => {
    setCursor(value.length);
  }, [isActive]);

  useInput(
    async (input, key) => {
      if (key.escape) {
        onCancel?.();
        return;
      }

      if (key.return) {
        await onConfirmType(value);
        return;
      }

      if (key.ctrl && input === "a") {
        setCursor(0);
        return;
      }

      if (key.ctrl && input === "e") {
        setCursor(value.length);
        return;
      }

      if (key.leftArrow) {
        setCursor((c) => Math.max(0, c - 1));
        return;
      }

      if (key.rightArrow) {
        setCursor((c) => Math.min(value.length, c + 1));
        return;
      }

      if ((key.backspace || key.delete) && key.meta) {
        onChange(value.slice(cursor));
        setCursor(0);
        return;
      }

      if (key.backspace || key.delete) {
        if (cursor > 0) {
          onChange(value.slice(0, cursor - 1) + value.slice(cursor));
          setCursor((c) => c - 1);
        }
        return;
      }

      if (!key.ctrl && !key.meta && input) {
        onChange(value.slice(0, cursor) + input + value.slice(cursor));
        setCursor((c) => c + input.length);
      }
    },
    { isActive },
  );

  if (isActive) {
    const before = value.slice(0, cursor);
    setCursorPosition({
      x: stringWidth(`> ${prompt}${before}`),
      y: cursorY,
    });
  }

  const before = value.slice(0, cursor);
  const at = value[cursor] ?? " ";
  const after = value.slice(cursor + 1);

  return (
    <Box>
      <Text color={isActive ? "cyan" : undefined}>
        {isActive ? "> " : "  "}
        {prompt}
      </Text>
      <Text color={isActive ? "cyan" : undefined}>{before}</Text>
      <Text color={isActive ? "cyan" : undefined} inverse={isActive}>
        {at}
      </Text>
      <Text color={isActive ? "cyan" : undefined}>{after}</Text>
    </Box>
  );
};
