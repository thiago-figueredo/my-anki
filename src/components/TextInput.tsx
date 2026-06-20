import React, { FC } from "react";
import { Box, Text } from "ink";
import Markdown, { getMarkdownAnsi } from "./Markdown";
import { useTextInput } from "../lib/useTextInput";
import chalk from "chalk";

type TextInputProps = {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onConfirmType: (text: string) => void | Promise<void>;
  isActive?: boolean;
  onCancel?: () => void;
  onTab?: () => string | void;
};

export const TextInput: FC<TextInputProps> = (props) => {
  const { value, prompt, isActive = true } = props;
  const { cursor } = useTextInput(props);

  const renderValue = () => {
    if (!isActive) {
      return <Markdown>{value}</Markdown>;
    }

    // Use a placeholder to render the string with markdown styles preserved
    // even if the cursor is in the middle of a styled block.
    const charAtCursor = value[cursor];
    const displayChar =
      charAtCursor === undefined || charAtCursor === "\n" ? " " : charAtCursor;

    // We use a special character that markdown won't escape
    const placeholder = "\uF000";
    const textWithPlaceholder =
      value.slice(0, cursor) + placeholder + value.slice(cursor + 1);

    const ansi = getMarkdownAnsi(textWithPlaceholder);

    // Replace placeholder with the inversed cursor character.
    // We use chalk directly for the inverse effect to keep it ANSI-compatible.
    const cursorAnsi = chalk.inverse(displayChar);

    // If we're at a newline, we need to ensure the newline itself is rendered
    // after the cursor block if we replaced a \n.
    const suffix = charAtCursor === "\n" ? "\n" : "";

    return <Text>{ansi.replace(placeholder, cursorAnsi) + suffix}</Text>;
  };

  return (
    <Box flexDirection="row">
      <Text color={isActive ? "cyan" : undefined}>
        {isActive ? "> " : "  "}
        {prompt}
      </Text>
      <Box>
        {renderValue()}
      </Box>
    </Box>
  );
};
