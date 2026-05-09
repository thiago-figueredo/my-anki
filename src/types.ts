export type Card = {
  id: number;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
};

export type Deck = {
  id: number;
  name: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
};

export enum Screen {
  Decks = "decks",
  CreateDeck = "createDeck",
  Deck = "deck",
  CreateCard = "createCard",
  Review = "review",
  SearchCards = "searchCards",
  EditDeck = "editDeck",
}
export type CardField = "front" | "back";
