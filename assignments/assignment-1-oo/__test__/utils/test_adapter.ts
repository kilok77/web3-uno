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
  standardRandomizer,
  type Randomizer,
  type Shuffler,
} from "../../src/utils/random_utils"
import {
  createGame as createModelGame,
  createGameFromMemento as restoreGame,
  type Game,
  type GameMemento,
} from "../../src/model/uno"

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

export type GameConfig = {
  players: string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

export function createGame(props: Partial<GameConfig>): Game {
  return createModelGame({
    players: props.players ?? ["A", "B"],
    targetScore: props.targetScore ?? 500,
    randomizer: props.randomizer ?? standardRandomizer,
    shuffler: props.shuffler ?? standardShuffler,
    cardsPerPlayer: props.cardsPerPlayer ?? 7,
  })
}

export function createGameFromMemento(
  memento: any,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler,
): Game {
  return restoreGame(memento as GameMemento, randomizer, shuffler)
}
