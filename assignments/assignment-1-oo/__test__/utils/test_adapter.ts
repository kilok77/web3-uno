import {
  Deck,
  createDeckFromMemento as restoreDeck,
  createInitialDeck as createDeck,
} from "../../src/model/deck"

export function createInitialDeck(): Deck {
  return createDeck()
}

export function createDeckFromMemento(
  cards: Record<string, string | number>[],
): Deck {
  return restoreDeck(cards)
}
