import { useState, useEffect } from "react";
import { useInput } from "ink";

type UseTextInputProps = {
  value: string;
  onChange: (text: string) => void;
  onConfirmType: (text: string) => void | Promise<void>;
  isActive?: boolean;
  onCancel?: () => void;
  onTab?: () => string | void;
};

export const useTextInput = ({
  value,
  onChange,
  onConfirmType,
  isActive = true,
  onCancel,
  onTab,
}: UseTextInputProps) => {
  const [cursor, setCursor] = useState(value.length);

  useEffect(() => {
    setCursor(value.length);
  }, [isActive]);

  const findWordBoundaryLeft = (pos: number) => {
    let i = pos - 1;
    while (i >= 0 && value[i] === " ") i--;
    while (i >= 0 && value[i] !== " ") i--;
    return i + 1;
  };

  const findWordBoundaryRight = (pos: number) => {
    let i = pos;
    while (i < value.length && value[i] === " ") i++;
    while (i < value.length && value[i] !== " ") i++;
    return i;
  };

  useInput(
    async (input, key) => {
      if (key.escape) {
        onCancel?.();
        return;
      }

      if (key.return) {
        if (key.meta) {
          onChange(value.slice(0, cursor) + "\n" + value.slice(cursor));
          setCursor((c) => c + 1);
          return;
        }
        await onConfirmType(value);
        return;
      }

      if (key.tab && onTab) {
        const completed = onTab();
        if (typeof completed === "string") {
          onChange(completed);
          setCursor(completed.length);
        }
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
        if (key.meta) {
          setCursor(findWordBoundaryLeft(cursor));
        } else {
          setCursor((c) => Math.max(0, c - 1));
        }
        return;
      }

      if (key.rightArrow) {
        if (key.meta) {
          setCursor(findWordBoundaryRight(cursor));
        } else {
          setCursor((c) => Math.min(value.length, c + 1));
        }
        return;
      }

      if ((key.backspace || key.delete) && key.meta) {
        const nextCursor = findWordBoundaryLeft(cursor);
        onChange(value.slice(0, nextCursor) + value.slice(cursor));
        setCursor(nextCursor);
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

  return {
    cursor,
    setCursor,
  };
};
