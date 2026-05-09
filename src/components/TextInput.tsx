import React, { FC, useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

type TextInputProps = {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onConfirmType: (text: string) => void | Promise<void>;
  isActive?: boolean;
  onCancel?: () => void;
};

export const TextInput: FC<TextInputProps> = ({
  prompt,
  value,
  onChange,
  onConfirmType,
  isActive = true,
  onCancel,
}) => {
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

  return (
    <Box>
      <Text color={isActive ? "cyan" : undefined}>
        {isActive ? "> " : "  "}
        {prompt}
      </Text>
      {isActive ? (
        <>
          <Text color="cyan">{value.slice(0, cursor)}</Text>
          <Text color="cyan" inverse>{value[cursor] ?? " "}</Text>
          <Text color="cyan">{value.slice(cursor + 1)}</Text>
        </>
      ) : (
        <Text>{value}</Text>
      )}
    </Box>
  );
};
