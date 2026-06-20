import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "../components/TextInput";
import Markdown from "../components/Markdown";
import { Card, CardField, Deck } from "../types";
import { formatDate } from "../lib/format";
import { useMarkSelection, markPrefix } from "../lib/useMarkSelection";

type SearchCardsScreenProps = {
  deck: Deck;
  onUpdateCard: (card: Pick<Card, "id" | "front" | "back">) => void;
  onDeleteCards: (cards: Card[]) => void;
  onBack: () => void;
};

type Mode = "search" | "selected" | "edit";

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export const SearchCardsScreen = ({
  deck,
  onUpdateCard,
  onDeleteCards,
  onBack,
}: SearchCardsScreenProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { marked, toggle, clear, getMarked } = useMarkSelection();
  const [mode, setMode] = useState<Mode>("search");
  const [editCard, setEditCard] = useState<Pick<Card, "id" | "front" | "back">>({
    id: 0,
    front: "",
    back: "",
  });

  const [activeField, setActiveField] = useState<CardField>("front");

  const filtered = useMemo(() => {
    if (!query.trim()) return deck.cards;
    const q = query.toLowerCase();
    return deck.cards.filter((c) => {
      return (
        c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
      );
    });
  }, [query, deck.cards]);

  const PAGE_SIZE = 10;
  const MAX_CHARS_CARD = 125;
  const [scrollOffset, setScrollOffset] = useState(0);
  const selectedCard = filtered[selectedIndex];

  useInput(
    (input, key) => {
      if (key.escape) {
        onBack();
        return;
      }

      if (key.upArrow || (key.ctrl && input === "p")) {
        setSelectedIndex((i) => {
          const next = Math.max(0, i - 1);
          if (next < scrollOffset) setScrollOffset(next);
          return next;
        });
        return;
      }

      if (key.downArrow || (key.ctrl && input === "n")) {
        setSelectedIndex((i) => {
          const next = Math.min(filtered.length - 1, i + 1);
          if (next >= scrollOffset + PAGE_SIZE)
            setScrollOffset(next - PAGE_SIZE + 1);
          return next;
        });
        return;
      }

      if (key.tab && selectedCard) {
        toggle(selectedCard.id);
        return;
      }

      if (key.ctrl && input === "d" && marked.size > 0) {
        onDeleteCards(getMarked(filtered));
        clear();
        setSelectedIndex(0);
        return;
      }

      if (key.return && selectedCard) {
        setMode("selected");
      }
    },
    { isActive: mode === "search" },
  );

  useInput(
    (input, key) => {
      if (key.escape) {
        setMode("search");
        return;
      }

      if (input === "e") {
        setEditCard({ ...selectedCard });
        setActiveField("front");
        setMode("edit");
        return;
      }

      if (input === "d") {
        onDeleteCards([selectedCard]);
        setMode("search");
        setSelectedIndex(0);
      }
    },
    { isActive: mode === "selected" },
  );

  useInput(
    (_, key) => {
      if (key.upArrow) {
        setActiveField("front");
        return;
      }

      if (key.downArrow) {
        setActiveField("back");
      }
    },
    { isActive: mode === "edit" },
  );

  const handleSave = () => {
    if (editCard.front.trim() && editCard.back.trim()) {
      onUpdateCard(editCard);
      setMode("search");
    }
  };

  const updateEditCard = (field: CardField, value: string) => {
    setEditCard((prev) => ({ ...prev, [field]: value }));
  };

  if (mode === "edit") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>Editing card</Text>
        <Box marginTop={1} flexDirection="column">
          {activeField === "front" ? (
            <TextInput
              prompt="Front: "
              value={editCard.front}
              onChange={(text) => updateEditCard("front", text)}
              onConfirmType={() => setActiveField("back")}
              onCancel={() => setMode("selected")}
            />
          ) : (
            <Box>
              <Text> Front: </Text>
              <Text>{editCard.front}</Text>
            </Box>
          )}
          {activeField === "back" ? (
            <TextInput
              prompt="Back: "
              value={editCard.back}
              onChange={(text) => updateEditCard("back", text)}
              onConfirmType={handleSave}
              onCancel={() => setMode("selected")}
            />
          ) : (
            <Box>
              <Text> Back: </Text>
              <Text>{editCard.back}</Text>
            </Box>
          )}
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>Up/Down switch</Text>
          <Text dimColor>Enter save</Text>
          <Text dimColor>Esc cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === "selected" && selectedCard) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="column">
          <Text bold>Front: </Text>
          <Markdown>{selectedCard.front}</Markdown>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text bold>Back: </Text>
          <Markdown>{selectedCard.back}</Markdown>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>e edit</Text>
          <Text dimColor>d delete</Text>
          <Text dimColor>Esc back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <TextInput
        prompt="Search: "
        value={query}
        onChange={(text) => {
          setQuery(text);
          setSelectedIndex(0);
          setScrollOffset(0);
        }}
        onConfirmType={() => {
          if (selectedCard) setMode("selected");
        }}
        onCancel={onBack}
      />

      <Box marginTop={1} flexDirection="column" gap={1}>
        {filtered.length === 0 ? (
          <Text dimColor>No cards found.</Text>
        ) : (
          <>
            {scrollOffset > 0 && <Text dimColor> ↑ {scrollOffset} more</Text>}
            {filtered
              .slice(scrollOffset, scrollOffset + PAGE_SIZE)
              .map((card, i) => {
                const index = scrollOffset + i;
                const isSelected = index === selectedIndex;
                const isMarked = marked.has(card.id);
                const prefix = markPrefix(isMarked, isSelected);

                return (
                  <Box key={card.id} flexDirection="row" gap={1}>
                    <Box>
                      <Text
                        color={
                          isSelected ? "cyan" : isMarked ? "yellow" : undefined
                        }
                      >
                        {prefix}
                      </Text>
                      <Markdown>
                        {truncate(card.front, MAX_CHARS_CARD)}
                      </Markdown>
                      <Text dimColor>
                        {" "}
                        created {formatDate(card.createdAt)} | updated{" "}
                        {formatDate(card.updatedAt)}
                      </Text>
                    </Box>
                  </Box>
                );
              })}
            {scrollOffset + PAGE_SIZE < filtered.length && (
              <Text dimColor>
                {" "}
                ↓ {filtered.length - scrollOffset - PAGE_SIZE} more
              </Text>
            )}
          </>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Up/Down select</Text>
        <Text dimColor>Tab mark</Text>
        <Text dimColor>Enter open</Text>
        {marked.size > 0 && <Text dimColor>Ctrl+d delete marked</Text>}
        <Text dimColor>Esc back</Text>
      </Box>
    </Box>
  );
};
