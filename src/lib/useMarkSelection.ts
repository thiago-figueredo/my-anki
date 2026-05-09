import { useState, useCallback } from "react";

export function useMarkSelection() {
  const [marked, setMarked] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setMarked(new Set());
  }, []);

  const getMarked = useCallback(
    <T extends { id: number }>(items: T[]): T[] => {
      return items.filter((item) => marked.has(item.id));
    },
    [marked],
  );

  return { marked, toggle, clear, getMarked };
}

export function markPrefix(isMarked: boolean, isSelected: boolean): string {
  return `${isMarked ? "x" : " "} ${isSelected ? "> " : "  "}`;
}
