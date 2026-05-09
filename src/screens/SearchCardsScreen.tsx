import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "../components/TextInput";
import { Card, CardField, Deck } from "../types";

type SearchCardsScreenProps = {
  deck: Deck;
  onUpdateCard: (card: Card) => void;
  onDeleteCards: (cards: Card[]) => void;
  onBack: () => void;
};

type Mode = "search" | "selected" | "edit";

export const SearchCardsScreen = ({
  deck,
  onUpdateCard,
  onDeleteCards,
  onBack,
}: SearchCardsScreenProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<Mode>("search");
  const [editCard, setEditCard] = useState<Card>({ id: 0, front: "", back: "" });
  const [activeField, setActiveField] = useState<CardField>("front");

  const filtered = useMemo(() => {
    if (!query.trim()) return deck.cards;
    const q = query.toLowerCase();
    return deck.cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q),
    );
  }, [query, deck.cards]);

  const selectedCard = filtered[selectedIndex];

  useInput(
    (input, key) => {
      if (key.escape) {
        onBack();
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }

      if (key.tab && selectedCard) {
        setMarked((prev) => {
          const next = new Set(prev);
          if (next.has(selectedCard.id)) {
            next.delete(selectedCard.id);
          } else {
            next.add(selectedCard.id);
          }
          return next;
        });
        return;
      }

      if (key.ctrl && input === "d" && marked.size > 0) {
        const toDelete = filtered.filter((c) => marked.has(c.id));
        onDeleteCards(toDelete);
        setMarked(new Set());
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
          <TextInput
            prompt="Front: "
            value={editCard.front}
            onChange={(text) => updateEditCard("front", text)}
            onConfirmType={() => setActiveField("back")}
            isActive={activeField === "front"}
            cursorY={3}
            onCancel={() => setMode("selected")}
          />
          <TextInput
            prompt="Back: "
            value={editCard.back}
            onChange={(text) => updateEditCard("back", text)}
            onConfirmType={handleSave}
            isActive={activeField === "back"}
            cursorY={4}
            onCancel={() => setMode("selected")}
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Up/Down switch Enter save Esc cancel</Text>
        </Box>
      </Box>
    );
  }

  if (mode === "selected" && selectedCard) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="column">
          <Text bold>Front: </Text>
          <Text>{selectedCard.front}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text bold>Back: </Text>
          <Text>{selectedCard.back}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text>e edit</Text>
          <Text>d delete</Text>
          <Text>Esc back</Text>
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
        }}
        onConfirmType={() => {
          if (selectedCard) setMode("selected");
        }}
        cursorY={2}
        onCancel={onBack}
      />

      <Box marginTop={1} flexDirection="column" gap={1}>
        {filtered.length === 0 ? (
          <Text dimColor>No cards found.</Text>
        ) : (
          filtered.map((card, index) => {
            const isSelected = index === selectedIndex;
            const isMarked = marked.has(card.id);
            const prefix = `${isMarked ? "x" : " "} ${isSelected ? "> " : "  "}`;
            return (
              <Box key={card.id} flexDirection="row" gap={1}>
                <Text
                  color={isSelected ? "cyan" : isMarked ? "yellow" : undefined}
                >
                  {prefix}
                  {card.front} / {card.back}
                </Text>
                <Text dimColor>
                  created {card.createdAt} | updated {card.updatedAt}
                </Text>
              </Box>
            );
          })
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Up/Down select Tab mark Enter open{marked.size > 0 ? " Ctrl+d delete marked" : ""} Esc back
        </Text>
      </Box>
    </Box>
  );
};
