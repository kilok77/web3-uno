import {
  Deck,
  createDeckFromMemento as restoreDeck,
  createInitialDeck as createDeck,
} from "../../src/model/deck"
import type { Card } from "../../src/model/deck"
import {
  createRound as createModelRound,
  createRoundFromMemento as restoreRound,
  type Round,
  type RoundMemento,
} from "../../src/model/round"
import {
  standardShuffler,
  type Shuffler,
} from "../../src/utils/random_utils"

export function createInitialDeck(): Deck {
  return createDeck()
}

export function createDeckFromMemento(
  cards: Record<string, string | number>[],
): Deck {
  return restoreDeck(cards)
}

export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({
  players,
  dealer,
  shuffler = standardShuffler,
  cardsPerPlayer = 7,
}: HandConfig): Round {
  return createModelRound({ players, dealer, shuffler, cardsPerPlayer })
}

export function createRoundFromMemento(
  memento: any,
  shuffler: Shuffler<Card> = standardShuffler,
): Round {
  return restoreRound(memento as RoundMemento, shuffler)
}
