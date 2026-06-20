import React, { useMemo, useState } from "react";
import { Box, Text, useApp } from "ink";
import { CreateCardScreen } from "./screens/CreateCardScreen";
import { CreateDeckScreen } from "./screens/CreateDeckScreen";
import { DeckDetailScreen } from "./screens/DeckDetailScreen";
import { DeckListScreen } from "./screens/DeckListScreen";
import { EditDeckScreen } from "./screens/EditDeckScreen";
import { ReviewDeckScreen } from "./screens/ReviewDeckScreen";
import { ImportCardsScreen } from "./screens/ImportCardsScreen";
import { SearchCardsScreen } from "./screens/SearchCardsScreen";
import { Card, Deck, Rating, Screen } from "./types";
import { CardService } from "./services/CardService";
import { DeckService } from "./services/DeckService";
import { EvaluationResult } from "./services/AiTutorService";

export const App = () => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>(Screen.Decks);
  const [decks, setDecks] = useState<Deck[]>(() => DeckService.list());
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);

  const selectedDeck = decks[selectedDeckIndex];

  const updateSelectedDeck = (updater: (deck: Deck) => Deck) => {
    setDecks((previous) =>
      previous.map((deck, index) =>
        index === selectedDeckIndex ? updater(deck) : deck,
      ),
    );
  };

  const title = useMemo(() => {
    const map = {
      [Screen.CreateDeck]: "Create Deck",
      [Screen.CreateCard]: "Add Card",
      [Screen.Review]: "Review",
      [Screen.Deck]: selectedDeck?.name ?? "Deck",
      [Screen.SearchCards]: "Search Cards",
      [Screen.EditDeck]: "Edit Deck",
      [Screen.ImportCards]: "Import Cards",
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
    updateSelectedDeck((deck) => ({ ...deck, name, updatedAt: new Date().toISOString() }));
    setScreen(Screen.Deck);
  };

  const importCards = (cards: Pick<Card, "front" | "back">[]) => {
    const created = CardService.createMany(selectedDeck.id, cards);
    updateSelectedDeck((deck) => ({ ...deck, cards: [...deck.cards, ...created] }));
    setScreen(Screen.Deck);
  };

  const createCard = (data: Pick<Card, "front" | "back">) => {
    const card = CardService.create(selectedDeck.id, data);
    updateSelectedDeck((deck) => ({ ...deck, cards: [...deck.cards, card] }));
  };

  const updateCard = (card: Pick<Card, "id" | "front" | "back">) => {
    CardService.update(card.id, { front: card.front, back: card.back });
    updateSelectedDeck((deck) => ({
      ...deck,
      cards: deck.cards.map((c) => (c.id === card.id ? (card as Card) : c)),
    }));
  };

  const reviewCard = (
    card: Card,
    rating: Rating,
    aiData?: { response: string; evaluation: EvaluationResult },
  ) => {
    const updated = CardService.review(card, rating, aiData);
    updateSelectedDeck((deck) => ({
      ...deck,
      cards: deck.cards.map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const deleteDeck = () => {
    DeckService.delete(selectedDeck.id);
    setDecks((previous) =>
      previous.filter((_, index) => index !== selectedDeckIndex),
    );
    setSelectedDeckIndex((i) => Math.max(0, i - 1));
    setScreen(Screen.Decks);
  };

  const deleteDecks = (toDelete: Deck[]) => {
    const ids = toDelete.map((d) => d.id);
    DeckService.deleteMany(ids);
    const idSet = new Set(ids);
    setDecks((previous) => previous.filter((d) => !idSet.has(d.id)));
    setSelectedDeckIndex(0);
  };

  const deleteCards = (cards: Card[]) => {
    const ids = cards.map((c) => c.id);
    CardService.deleteMany(ids);
    const idSet = new Set(ids);
    updateSelectedDeck((deck) => ({
      ...deck,
      cards: deck.cards.filter((c) => !idSet.has(c.id)),
    }));
  };

  const screens = {
    decks: () => (
      <DeckListScreen
        decks={decks}
        selectedDeckIndex={selectedDeckIndex}
        onSelectDeck={setSelectedDeckIndex}
        onOpenDeck={() => setScreen(Screen.Deck)}
        onCreateDeck={() => setScreen(Screen.CreateDeck)}
        onDeleteDecks={deleteDecks}
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
        onImportCards={() => setScreen(Screen.ImportCards)}
        onSearchCards={() => setScreen(Screen.SearchCards)}
        onEditDeck={() => setScreen(Screen.EditDeck)}
        onDeleteDeck={deleteDeck}
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
        onReviewCard={reviewCard}
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
    importCards: () => (
      <ImportCardsScreen
        deck={selectedDeck}
        onImportCards={importCards}
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
