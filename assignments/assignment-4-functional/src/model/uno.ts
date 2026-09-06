import * as _ from 'lodash'
import type { Card } from './deck'
import * as Round from './round'
import {
  standardRandomizer,
  standardShuffler,
  type Randomizer,
  type Shuffler,
} from '../utils/random_utils'

export type Props = {
  readonly players: ReadonlyArray<string>
  readonly targetScore: number
  readonly randomizer: Randomizer
  readonly shuffler: Shuffler<Card>
  readonly cardsPerPlayer: number
}

export type Game = {
  readonly players: ReadonlyArray<string>
  readonly playerCount: number
  readonly targetScore: number
  readonly scores: ReadonlyArray<number>
  readonly winner?: number
  readonly currentRound?: Round.Round
  readonly _randomizer: Randomizer
  readonly _shuffler: Shuffler<Card>
  readonly _cardsPerPlayer: number
  readonly _seatOffset: number
}

export function createGame(props: Partial<Props> = {}): Game {
  const players = [...(props.players ?? ['A', 'B'])]
  const targetScore = props.targetScore ?? 500
  const randomizer = props.randomizer ?? standardRandomizer
  const shuffler = props.shuffler ?? standardShuffler
  const cardsPerPlayer = props.cardsPerPlayer ?? 7

  if (players.length < 2) throw new Error('A Game requires at least two players')
  if (targetScore <= 0) throw new Error('Game target score must be positive')
  if (!Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 0) throw new Error('Invalid starting hand size')

  const seatOffset = 0
  return makeGame({
    players,
    targetScore,
    scores: players.map(() => 0),
    currentRound: startRound(players, seatOffset, randomizer, shuffler, cardsPerPlayer),
    randomizer,
    shuffler,
    cardsPerPlayer,
    seatOffset,
  })
}

/**
 * Applies a pure Round transformation. Completed-round scores are translated
 * from the rotated Round seating back to the stable Game player order.
 */
export function play(action: (round: Round.Round) => Round.Round, game: Game): Game {
  if (game.winner !== undefined || game.currentRound === undefined) {
    throw new Error('The Game has ended')
  }

  const nextRound = action(game.currentRound)
  if (!Round.hasEnded(nextRound)) {
    return makeGame({
      players: game.players,
      targetScore: game.targetScore,
      scores: game.scores,
      currentRound: nextRound,
      randomizer: game._randomizer,
      shuffler: game._shuffler,
      cardsPerPlayer: game._cardsPerPlayer,
      seatOffset: game._seatOffset,
    })
  }

  const roundWinner = Round.winner(nextRound)
  const roundScore = Round.score(nextRound)
  if (roundWinner === undefined || roundScore === undefined) {
    throw new Error('Ended Round must have a winner and score')
  }

  const gameWinnerIndex = normalize(roundWinner + game._seatOffset, game.playerCount)
  const scores = game.scores.map((value, index) =>
    index === gameWinnerIndex ? value + roundScore : value,
  )

  if (scores[gameWinnerIndex] >= game.targetScore) {
    return makeGame({
      players: game.players,
      targetScore: game.targetScore,
      scores,
      winner: gameWinnerIndex,
      currentRound: undefined,
      randomizer: game._randomizer,
      shuffler: game._shuffler,
      cardsPerPlayer: game._cardsPerPlayer,
      seatOffset: game._seatOffset,
    })
  }

  const seatOffset = normalize(game._seatOffset + 1, game.playerCount)
  return makeGame({
    players: game.players,
    targetScore: game.targetScore,
    scores,
    currentRound: startRound(
      game.players,
      seatOffset,
      game._randomizer,
      game._shuffler,
      game._cardsPerPlayer,
    ),
    randomizer: game._randomizer,
    shuffler: game._shuffler,
    cardsPerPlayer: game._cardsPerPlayer,
    seatOffset,
  })
}

function startRound(
  players: ReadonlyArray<string>,
  seatOffset: number,
  randomizer: Randomizer,
  shuffler: Shuffler<Card>,
  cardsPerPlayer: number,
): Round.Round {
  const seatedPlayers = rotateLeft(players, seatOffset)
  return Round.createRound(
    seatedPlayers,
    randomizer(seatedPlayers.length),
    shuffler,
    cardsPerPlayer,
  )
}

function rotateLeft<T>(items: ReadonlyArray<T>, offset: number): T[] {
  const normalized = normalize(offset, items.length)
  return _.concat(_.drop(items, normalized), _.take(items, normalized))
}

function normalize(index: number, count: number): number {
  return ((index % count) + count) % count
}

function makeGame(input: {
  readonly players: ReadonlyArray<string>
  readonly targetScore: number
  readonly scores: ReadonlyArray<number>
  readonly winner?: number
  readonly currentRound?: Round.Round
  readonly randomizer: Randomizer
  readonly shuffler: Shuffler<Card>
  readonly cardsPerPlayer: number
  readonly seatOffset: number
}): Game {
  return {
    players: [...input.players],
    playerCount: input.players.length,
    targetScore: input.targetScore,
    scores: [...input.scores],
    winner: input.winner,
    currentRound: input.currentRound,
    _randomizer: input.randomizer,
    _shuffler: input.shuffler,
    _cardsPerPlayer: input.cardsPerPlayer,
    _seatOffset: input.seatOffset,
  }
}

export const totalScore = (game: Game): number => _.sum(game.scores)
