import React, { useMemo, useState } from "react";
import { Box, Text, useApp } from "ink";
import { CreateCardScreen } from "./screens/CreateCardScreen";
import { CreateDeckScreen } from "./screens/CreateDeckScreen";
import { DeckDetailScreen } from "./screens/DeckDetailScreen";
import { DeckListScreen } from "./screens/DeckListScreen";
import { EditDeckScreen } from "./screens/EditDeckScreen";
import { ReviewDeckScreen } from "./screens/ReviewDeckScreen";
import { SearchCardsScreen } from "./screens/SearchCardsScreen";
import { Card, Deck, Screen } from "./types";
import { CardService } from "./services/CardService";
import { DeckService } from "./services/DeckService";

export const App = () => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>(Screen.Decks);
  const [decks, setDecks] = useState<Deck[]>(() => DeckService.list());
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);

  const selectedDeck = decks[selectedDeckIndex];

  const title = useMemo(() => {
    const map = {
      [Screen.CreateDeck]: "Create Deck",
      [Screen.CreateCard]: "Add Card",
      [Screen.Review]: "Review",
      [Screen.Deck]: selectedDeck?.name ?? "Deck",
      [Screen.SearchCards]: "Search Cards",
      [Screen.EditDeck]: "Edit Deck",
      [Screen.Decks]: "Decks",
    };

    return map[screen];
  }, [screen, selectedDeck?.name]);

  const createDeck = (name: string) => {
    const deck = DeckService.create({ name });
    setDecks((previous) => [...previous, deck]);
    setSelectedDeckIndex(decks.length);
    setScreen(Screen.Deck);
  };

  const updateDeck = (name: string) => {
    DeckService.update(selectedDeck.id, name);
    setDecks((previous) =>
      previous.map((deck, index) =>
        index === selectedDeckIndex ? { ...deck, name, updatedAt: new Date().toISOString() } : deck,
      ),
    );
    setScreen(Screen.Deck);
  };

  const createCard = (data: Pick<Card, "front" | "back">) => {
    const card = CardService.create(selectedDeck.id, data);
    setDecks((previous) => {
      return previous.map((deck, index) => {
        return index === selectedDeckIndex
          ? { ...deck, cards: [...deck.cards, card] }
          : deck;
      });
    });
  };

  const updateCard = (card: Card) => {
    CardService.update(card.id, { front: card.front, back: card.back });
    setDecks((previous) =>
      previous.map((deck, index) =>
        index === selectedDeckIndex
          ? {
              ...deck,
              cards: deck.cards.map((c) => (c.id === card.id ? card : c)),
            }
          : deck,
      ),
    );
  };

  const deleteCards = (cards: Card[]) => {
    const ids = cards.map((c) => c.id);
    CardService.deleteMany(ids);
    const idSet = new Set(ids);

    setDecks((previous) =>
      previous.map((deck, index) =>
        index === selectedDeckIndex
          ? { ...deck, cards: deck.cards.filter((c) => !idSet.has(c.id)) }
          : deck,
      ),
    );
  };

  const screens = {
    decks: () => (
      <DeckListScreen
        decks={decks}
        selectedDeckIndex={selectedDeckIndex}
        onSelectDeck={setSelectedDeckIndex}
        onOpenDeck={() => setScreen(Screen.Deck)}
        onCreateDeck={() => setScreen(Screen.CreateDeck)}
        onQuit={exit}
      />
    ),
    createDeck: () => (
      <CreateDeckScreen
        onCreateDeck={createDeck}
        onCancel={() => setScreen(Screen.Decks)}
      />
    ),
    deck: () => (
      <DeckDetailScreen
        deck={selectedDeck}
        onCreateCard={() => setScreen(Screen.CreateCard)}
        onSearchCards={() => setScreen(Screen.SearchCards)}
        onEditDeck={() => setScreen(Screen.EditDeck)}
        onReview={() => setScreen(Screen.Review)}
        onBack={() => setScreen(Screen.Decks)}
        onQuit={exit}
      />
    ),
    createCard: () => (
      <CreateCardScreen
        deck={selectedDeck}
        onCreateCard={createCard}
        onCancel={() => setScreen(Screen.Deck)}
      />
    ),
    review: () => (
      <ReviewDeckScreen
        deck={selectedDeck}
        onBack={() => setScreen(Screen.Deck)}
        onQuit={exit}
      />
    ),
    editDeck: () => (
      <EditDeckScreen
        deck={selectedDeck}
        onSave={updateDeck}
        onCancel={() => setScreen(Screen.Deck)}
      />
    ),
    searchCards: () => (
      <SearchCardsScreen
        deck={selectedDeck}
        onUpdateCard={updateCard}
        onDeleteCards={deleteCards}
        onBack={() => setScreen(Screen.Deck)}
      />
    ),
  };

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      {screens[screen]()}
    </Box>
  );
};
