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

  return makeGame({
    players,
    targetScore,
    scores: players.map(() => 0),
    currentRound: startRound(players, randomizer, shuffler, cardsPerPlayer),
    randomizer,
    shuffler,
    cardsPerPlayer,
  })
}

/**
 * Applies one pure Round transformation to the current round. If the round
 * ends, its score is folded into the immutable game state and a new round is
 * started unless the target score has been reached.
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
    })
  }

  const roundWinner = Round.winner(nextRound)
  const roundScore = Round.score(nextRound)
  if (roundWinner === undefined || roundScore === undefined) {
    throw new Error('Ended Round must have a winner and score')
  }

  const scores = game.scores.map((value, index) => index === roundWinner ? value + roundScore : value)
  if (scores[roundWinner] >= game.targetScore) {
    return makeGame({
      players: game.players,
      targetScore: game.targetScore,
      scores,
      winner: roundWinner,
      currentRound: undefined,
      randomizer: game._randomizer,
      shuffler: game._shuffler,
      cardsPerPlayer: game._cardsPerPlayer,
    })
  }

  return makeGame({
    players: game.players,
    targetScore: game.targetScore,
    scores,
    currentRound: startRound(game.players, game._randomizer, game._shuffler, game._cardsPerPlayer),
    randomizer: game._randomizer,
    shuffler: game._shuffler,
    cardsPerPlayer: game._cardsPerPlayer,
  })
}

function startRound(
  players: ReadonlyArray<string>,
  randomizer: Randomizer,
  shuffler: Shuffler<Card>,
  cardsPerPlayer: number,
): Round.Round {
  return Round.createRound(players, randomizer(players.length), shuffler, cardsPerPlayer)
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
  }
}

// Keep lodash part of the functional implementation surface as required by
// the assignment; this also makes the intent explicit for future A5 reuse.
export const totalScore = (game: Game): number => _.sum(game.scores)
