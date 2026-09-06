import type { Card } from "./deck"
import {
  createRound,
  createRoundFromMemento,
  type Round,
  type RoundMemento,
} from "./round"
import {
  standardRandomizer,
  standardShuffler,
  type Randomizer,
  type Shuffler,
} from "../utils/random_utils"

export type GameConfig = {
  readonly players?: readonly string[]
  readonly targetScore?: number
  readonly randomizer?: Randomizer
  readonly shuffler?: Shuffler<Card>
  readonly cardsPerPlayer?: number
}

export type GameMemento = {
  readonly players: readonly string[]
  readonly currentRound?: RoundMemento
  readonly targetScore: number
  readonly scores: readonly number[]
  readonly cardsPerPlayer: number
}

type RestoredGameState = {
  readonly scores: readonly number[]
  readonly currentRound?: RoundMemento
}

/** Coordinates successive rounds and cumulative scores for one UNO game. */
export class Game {
  readonly #players: string[]
  readonly #scores: number[]
  readonly #randomizer: Randomizer
  readonly #shuffler: Shuffler<Card>
  readonly #cardsPerPlayer: number
  #round: Round | undefined
  #winnerIndex: number | undefined

  readonly targetScore: number

  constructor({
    players = ["A", "B"],
    targetScore = 500,
    randomizer = standardRandomizer,
    shuffler = standardShuffler,
    cardsPerPlayer = 7,
  }: GameConfig = {}, restoredState?: RestoredGameState) {
    assertGameConfiguration(players, targetScore, cardsPerPlayer)

    this.#players = [...players]
    this.targetScore = targetScore
    this.#randomizer = randomizer
    this.#shuffler = shuffler
    this.#cardsPerPlayer = cardsPerPlayer
    this.#winnerIndex = undefined

    if (restoredState === undefined) {
      this.#scores = players.map(() => 0)
      this.startRound()
      return
    }

    this.#scores = [...restoredState.scores]
    this.#winnerIndex = this.#scores.findIndex(score => score >= targetScore)
    if (this.#winnerIndex === -1) this.#winnerIndex = undefined

    if (restoredState.currentRound !== undefined) {
      this.#round = createRoundFromMemento(restoredState.currentRound, shuffler)
      this.observeRound(this.#round)
    }
  }

  get playerCount(): number {
    return this.#players.length
  }

  player(index: number): string {
    assertPlayerIndex(index, this.playerCount)
    return this.#players[index]
  }

  score(index: number): number {
    assertPlayerIndex(index, this.playerCount)
    return this.#scores[index]
  }

  winner(): number | undefined {
    return this.#winnerIndex
  }

  currentRound(): Round | undefined {
    return this.#round
  }

  toMemento(): GameMemento {
    const memento: GameMemento = {
      players: [...this.#players],
      targetScore: this.targetScore,
      scores: [...this.#scores],
      cardsPerPlayer: this.#cardsPerPlayer,
    }
    const currentRound = this.#round?.toMemento()
    return currentRound === undefined ? memento : { ...memento, currentRound }
  }

  private startRound(): void {
    const round = createRound({
      players: this.#players,
      dealer: this.#randomizer(this.playerCount),
      shuffler: this.#shuffler,
      cardsPerPlayer: this.#cardsPerPlayer,
    })
    this.#round = round
    this.observeRound(round)
  }

  private observeRound(round: Round): void {
    round.onEnd(({ winner }) => {
      if (this.#round !== round || this.#winnerIndex !== undefined) return

      const roundScore = round.score()
      if (roundScore === undefined) return
      this.#scores[winner] += roundScore

      if (this.#scores[winner] >= this.targetScore) {
        this.#winnerIndex = winner
        this.#round = undefined
        return
      }
      this.startRound()
    })
  }
}

export function createGame(config: GameConfig = {}): Game {
  return new Game(config)
}

export function createGameFromMemento(
  memento: unknown,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler,
): Game {
  assertGameMemento(memento)
  return new Game(
    {
      players: memento.players,
      targetScore: memento.targetScore,
      randomizer,
      shuffler,
      cardsPerPlayer: memento.cardsPerPlayer,
    },
    {
      scores: memento.scores,
      currentRound: memento.currentRound,
    },
  )
}

function assertGameMemento(value: unknown): asserts value is GameMemento {
  if (!isRecord(value) || !Array.isArray(value.players) || value.players.length < 2) {
    throw new Error("A Game memento requires at least two players")
  }
  if (!value.players.every(player => typeof player === "string")) {
    throw new Error("Game players must be strings")
  }
  if (typeof value.targetScore !== "number" || value.targetScore <= 0) {
    throw new Error("Game target score must be positive")
  }
  const targetScore = value.targetScore
  if (!Array.isArray(value.scores) || value.scores.length !== value.players.length) {
    throw new Error("A Game memento requires one score per player")
  }
  if (!value.scores.every(score => typeof score === "number" && score >= 0)) {
    throw new Error("Game scores cannot be negative")
  }
  const winners = value.scores.filter(score => score >= targetScore)
  if (winners.length > 1) {
    throw new Error("A Game cannot have more than one winner")
  }
  if (!Number.isInteger(value.cardsPerPlayer) || (value.cardsPerPlayer as number) < 0) {
    throw new Error("Game cards per player must be a non-negative integer")
  }
  if (winners.length === 0 && value.currentRound === undefined) {
    throw new Error("An unfinished Game requires a current Round")
  }
  if (value.currentRound !== undefined) {
    createRoundFromMemento(value.currentRound)
  }
}

function assertGameConfiguration(
  players: readonly string[],
  targetScore: number,
  cardsPerPlayer: number,
): void {
  if (players.length < 2) throw new Error("A Game requires at least two players")
  if (targetScore <= 0) throw new Error("Game target score must be positive")
  if (!Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 0) {
    throw new Error("Cards per player must be a non-negative integer")
  }
}

function assertPlayerIndex(index: number, playerCount: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= playerCount) {
    throw new Error("Player index is out of bounds")
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
