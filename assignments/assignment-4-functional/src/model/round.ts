import * as _ from 'lodash'
import { colors, createInitialDeck, type Card, type Color, type Deck } from './deck'
import { standardShuffler, type Shuffler } from '../utils/random_utils'

export type Direction = 'clockwise' | 'counterclockwise'

type Accusation = { readonly accuser: number; readonly accused: number }
type InitialDiscard = Card & {
  readonly type: 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW'
  readonly color: Color
}

export type Round = {
  readonly players: ReadonlyArray<string>
  readonly playerCount: number
  readonly dealer: number
  readonly hands: ReadonlyArray<ReadonlyArray<Card>>
  readonly drawPile: Deck
  readonly discardPile: Deck
  readonly playerInTurn?: number
  readonly currentColor: Color
  readonly direction: Direction
  readonly currentDirection: Direction
  readonly _shuffler: Shuffler<Card>
  readonly _playableDrawnCardIndex?: number
  readonly _unoVulnerablePlayers: ReadonlyArray<number>
  readonly _declaredUnoPlayer?: number
}

export type RoundMemento = {
  readonly players: ReadonlyArray<string>
  readonly hands: ReadonlyArray<ReadonlyArray<Card>>
  readonly drawPile: Deck
  readonly discardPile: Deck
  readonly currentColor: Color
  readonly currentDirection: Direction
  readonly dealer: number
  readonly playerInTurn?: number
}

export function createRound(
  players: ReadonlyArray<string>,
  dealer: number,
  shuffler: Shuffler<Card> = standardShuffler,
  cardsPerPlayer = 7,
): Round {
  assertPlayerCount(players.length)
  assertStartingHandSize(cardsPerPlayer, players.length)
  assertDealer(dealer)

  const shuffled: Deck = shuffler(createInitialDeck())
  const hands = _.range(players.length).map(player =>
    shuffled.slice(player * cardsPerPlayer, (player + 1) * cardsPerPlayer),
  )
  let drawPile: Deck = shuffled.slice(players.length * cardsPerPlayer)

  const initial = takeInitialDiscard(drawPile, shuffler)
  drawPile = initial.drawPile

  let direction: Direction = 'clockwise'
  let playerInTurn = advance(dealer, 1, players.length)
  let resolvedHands: ReadonlyArray<ReadonlyArray<Card>> = hands

  switch (initial.card.type) {
    case 'REVERSE':
      direction = 'counterclockwise'
      playerInTurn = advance(dealer, -1, players.length)
      break
    case 'SKIP':
      playerInTurn = advance(dealer, 2, players.length)
      break
    case 'DRAW': {
      const penalized = advance(dealer, 1, players.length)
      const penalty = drawInitialCards(resolvedHands, penalized, drawPile, 2)
      resolvedHands = penalty.hands
      drawPile = penalty.drawPile
      playerInTurn = advance(dealer, 2, players.length)
      break
    }
    case 'NUMBERED':
      break
  }

  return makeRound({
    players,
    dealer,
    hands: resolvedHands,
    drawPile,
    discardPile: [copyCard(initial.card)],
    playerInTurn,
    currentColor: initial.card.color,
    direction,
    shuffler,
  })
}

export function createRoundFromMemento(
  memento: RoundMemento,
  shuffler: Shuffler<Card> = standardShuffler,
): Round {
  if (memento.players.length < 2 || memento.hands.length !== memento.players.length) {
    throw new Error('Invalid Round memento')
  }
  if (memento.discardPile.length === 0 || !colors.includes(memento.currentColor)) {
    throw new Error('Invalid Round memento')
  }
  return makeRound({
    players: memento.players,
    dealer: memento.dealer,
    hands: memento.hands,
    drawPile: memento.drawPile,
    discardPile: memento.discardPile,
    playerInTurn: memento.playerInTurn,
    currentColor: memento.currentColor,
    direction: memento.currentDirection,
    shuffler,
  })
}

export function toMemento(round: Round): RoundMemento {
  const base: RoundMemento = {
    players: [...round.players],
    hands: round.hands.map(hand => hand.map(copyCard)),
    drawPile: round.drawPile.map(copyCard),
    discardPile: round.discardPile.map(copyCard),
    currentColor: round.currentColor,
    currentDirection: round.currentDirection,
    dealer: round.dealer,
  }
  return round.playerInTurn === undefined ? base : { ...base, playerInTurn: round.playerInTurn }
}

export const topOfDiscard = (round: Round): Card | undefined => round.discardPile[0]

export function canPlay(cardIndex: number, round: Round): boolean {
  if (hasEnded(round) || round.playerInTurn === undefined) return false
  const hand = round.hands[round.playerInTurn]
  if (!isCardIndex(cardIndex, hand.length)) return false
  if (round._playableDrawnCardIndex !== undefined && cardIndex !== round._playableDrawnCardIndex) return false
  const top = topOfDiscard(round)
  return top !== undefined && isPlayable(hand[cardIndex], top, round.currentColor, hand)
}

export function canPlayAny(round: Round): boolean {
  if (round.playerInTurn === undefined) return false
  return round.hands[round.playerInTurn].some((_card, index) => canPlay(index, round))
}

export function play(cardIndex: number, selectedColor: Color | undefined, round: Round): Round {
  assertInProgress(round)
  const actor = round.playerInTurn as number
  const hand = round.hands[actor]
  if (!isCardIndex(cardIndex, hand.length) || !canPlay(cardIndex, round)) {
    throw new Error('The selected card cannot be played')
  }

  const card = hand[cardIndex]
  const wild = card.type === 'WILD' || card.type === 'WILD DRAW'
  if (wild && (selectedColor === undefined || !colors.includes(selectedColor))) {
    throw new Error('A Wild card requires a selected color')
  }
  if (!wild && selectedColor !== undefined) throw new Error('A colored card cannot select a color')

  const declaredUno = round._declaredUnoPlayer === actor
  const nextHand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)]
  let next = makeRound({
    ...data(round),
    hands: replaceAt(round.hands, actor, nextHand),
    discardPile: [copyCard(card), ...round.discardPile.map(copyCard)],
    currentColor: wild ? selectedColor as Color : card.color,
    playableDrawnCardIndex: undefined,
    declaredUnoPlayer: undefined,
    unoVulnerablePlayers: [],
  })

  next = applyCardEffect(card, next)
  if (next.hands[actor].length === 0) {
    return makeRound({ ...data(next), playerInTurn: undefined, unoVulnerablePlayers: [], declaredUnoPlayer: undefined })
  }
  if (next.hands[actor].length === 1 && !declaredUno) {
    return makeRound({ ...data(next), unoVulnerablePlayers: [actor] })
  }
  return next
}

export function draw(round: Round): Round {
  assertInProgress(round)
  if (round._playableDrawnCardIndex !== undefined) throw new Error('The playable drawn card must be played')

  const actor = round.playerInTurn as number
  const taken = takeDrawCard(round.drawPile, round.discardPile, round._shuffler)
  const newHand = [...round.hands[actor], copyCard(taken.card)]
  const next = makeRound({
    ...data(round),
    hands: replaceAt(round.hands, actor, newHand),
    drawPile: taken.drawPile,
    discardPile: taken.discardPile,
    declaredUnoPlayer: undefined,
    unoVulnerablePlayers: [],
  })

  const drawnIndex = newHand.length - 1
  const top = topOfDiscard(next)
  if (top !== undefined && isPlayable(taken.card, top, next.currentColor, newHand)) {
    return makeRound({ ...data(next), playableDrawnCardIndex: drawnIndex })
  }
  return advanceTurn(next)
}

export function sayUno(playerIndex: number, round: Round): Round {
  assertInProgress(round)
  assertPlayerIndex(playerIndex, round.playerCount)
  if (round._unoVulnerablePlayers.includes(playerIndex)) {
    return makeRound({
      ...data(round),
      unoVulnerablePlayers: round._unoVulnerablePlayers.filter(index => index !== playerIndex),
    })
  }
  if (playerIndex === round.playerInTurn && round.hands[playerIndex].length === 2) {
    return makeRound({ ...data(round), declaredUnoPlayer: playerIndex })
  }
  return round
}

export function checkUnoFailure({ accused }: Accusation, round: Round): boolean {
  assertPlayerIndex(accused, round.playerCount)
  return round._unoVulnerablePlayers.includes(accused)
}

export function catchUnoFailure(accusation: Accusation, round: Round): Round {
  if (!checkUnoFailure(accusation, round)) return round
  const penalized = drawCardsToPlayer(round, accusation.accused, 4)
  return makeRound({
    ...data(penalized),
    unoVulnerablePlayers: penalized._unoVulnerablePlayers.filter(index => index !== accusation.accused),
  })
}

export const hasEnded = (round: Round): boolean => round.hands.some(hand => hand.length === 0)

export function winner(round: Round): number | undefined {
  const found = round.hands.findIndex(hand => hand.length === 0)
  return found === -1 ? undefined : found
}

export function score(round: Round): number | undefined {
  const winningPlayer = winner(round)
  if (winningPlayer === undefined) return undefined
  return _.sum(round.hands.map((hand, index) =>
    index === winningPlayer ? 0 : _.sum(hand.map(scoreCard)),
  ))
}

function applyCardEffect(card: Card, round: Round): Round {
  switch (card.type) {
    case 'SKIP':
      return advanceTurn(round, 2)
    case 'REVERSE': {
      const direction: Direction = round.direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
      return advanceTurn(makeRound({ ...data(round), direction }), round.playerCount === 2 ? 2 : 1)
    }
    case 'DRAW':
      return applyDrawPenalty(round, 2)
    case 'WILD DRAW':
      return applyDrawPenalty(round, 4)
    case 'NUMBERED':
    case 'WILD':
      return advanceTurn(round)
  }
}

function applyDrawPenalty(round: Round, count: number): Round {
  const target = nextPlayer(round)
  return advanceTurn(drawCardsToPlayer(round, target, count), 2)
}

function drawCardsToPlayer(round: Round, playerIndex: number, count: number): Round {
  let drawPile: Deck = round.drawPile
  let discardPile: Deck = round.discardPile
  let hand: ReadonlyArray<Card> = round.hands[playerIndex]

  for (const _ of _.range(count)) {
    const taken = takeDrawCard(drawPile, discardPile, round._shuffler)
    hand = [...hand, copyCard(taken.card)]
    drawPile = taken.drawPile
    discardPile = taken.discardPile
  }

  return makeRound({
    ...data(round),
    hands: replaceAt(round.hands, playerIndex, hand),
    drawPile,
    discardPile,
  })
}

function takeDrawCard(drawPile: Deck, discardPile: Deck, shuffler: Shuffler<Card>): {
  readonly card: Card
  readonly drawPile: Deck
  readonly discardPile: Deck
} {
  let available: Deck = drawPile
  let discard: Deck = discardPile
  if (available.length === 0) {
    const recycled = recycle(discard, shuffler)
    available = recycled.drawPile
    discard = recycled.discardPile
  }

  const card = available[0]
  if (card === undefined) throw new Error('No card is available to draw')
  available = available.slice(1)

  if (available.length === 0) {
    const recycled = recycle(discard, shuffler)
    available = recycled.drawPile
    discard = recycled.discardPile
  }
  return { card: copyCard(card), drawPile: available.map(copyCard), discardPile: discard.map(copyCard) }
}

function recycle(discardPile: Deck, shuffler: Shuffler<Card>): {
  readonly drawPile: Deck
  readonly discardPile: Deck
} {
  const [top, ...older] = discardPile
  if (top === undefined || older.length === 0) return { drawPile: [], discardPile }
  return { drawPile: shuffler(older.map(copyCard)).map(copyCard), discardPile: [copyCard(top)] }
}

function takeInitialDiscard(drawPile: Deck, shuffler: Shuffler<Card>): {
  readonly card: InitialDiscard
  readonly drawPile: Deck
} {
  let available: Deck = drawPile
  while (true) {
    const [candidate, ...remaining] = available
    if (candidate === undefined) throw new Error('The deck does not contain an initial discard')
    if (candidate.type !== 'WILD' && candidate.type !== 'WILD DRAW') {
      return { card: candidate as InitialDiscard, drawPile: remaining.map(copyCard) }
    }
    available = shuffler([...remaining, candidate]).map(copyCard)
  }
}

function drawInitialCards(
  hands: ReadonlyArray<ReadonlyArray<Card>>,
  playerIndex: number,
  drawPile: Deck,
  count: number,
): { readonly hands: ReadonlyArray<ReadonlyArray<Card>>; readonly drawPile: Deck } {
  if (drawPile.length < count) throw new Error('The draw pile does not contain enough cards')
  return {
    hands: replaceAt(hands, playerIndex, [...hands[playerIndex], ...drawPile.slice(0, count).map(copyCard)]),
    drawPile: drawPile.slice(count).map(copyCard),
  }
}

function advanceTurn(round: Round, distance = 1): Round {
  if (round.playerInTurn === undefined) return round
  const delta = round.direction === 'clockwise' ? distance : -distance
  return makeRound({ ...data(round), playerInTurn: advance(round.playerInTurn, delta, round.playerCount) })
}

function nextPlayer(round: Round): number {
  if (round.playerInTurn === undefined) throw new Error('The Round has ended')
  return advance(round.playerInTurn, round.direction === 'clockwise' ? 1 : -1, round.playerCount)
}

function isPlayable(card: Card, top: Card, currentColor: Color, hand: ReadonlyArray<Card>): boolean {
  if (card.type === 'WILD') return true
  if (card.type === 'WILD DRAW') return !hand.some(held => held.type !== 'WILD' && held.type !== 'WILD DRAW' && held.color === currentColor)
  if (card.color === currentColor) return true
  if (card.type === 'NUMBERED' && top.type === 'NUMBERED') return card.number === top.number
  return isAction(card) && isAction(top) && card.type === top.type
}

const isAction = (card: Card): boolean => card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW'

function scoreCard(card: Card): number {
  switch (card.type) {
    case 'NUMBERED': return card.number
    case 'SKIP':
    case 'REVERSE':
    case 'DRAW': return 20
    case 'WILD':
    case 'WILD DRAW': return 50
  }
}

function makeRound(input: {
  readonly players: ReadonlyArray<string>
  readonly dealer: number
  readonly hands: ReadonlyArray<ReadonlyArray<Card>>
  readonly drawPile: Deck
  readonly discardPile: Deck
  readonly playerInTurn?: number
  readonly currentColor: Color
  readonly direction: Direction
  readonly shuffler: Shuffler<Card>
  readonly playableDrawnCardIndex?: number
  readonly unoVulnerablePlayers?: ReadonlyArray<number>
  readonly declaredUnoPlayer?: number
}): Round {
  return {
    players: [...input.players],
    playerCount: input.players.length,
    dealer: input.dealer,
    hands: input.hands.map(hand => hand.map(copyCard)),
    drawPile: input.drawPile.map(copyCard),
    discardPile: input.discardPile.map(copyCard),
    playerInTurn: input.playerInTurn,
    currentColor: input.currentColor,
    direction: input.direction,
    currentDirection: input.direction,
    _shuffler: input.shuffler,
    _playableDrawnCardIndex: input.playableDrawnCardIndex,
    _unoVulnerablePlayers: [...(input.unoVulnerablePlayers ?? [])],
    _declaredUnoPlayer: input.declaredUnoPlayer,
  }
}

function data(round: Round) {
  return {
    players: round.players,
    dealer: round.dealer,
    hands: round.hands,
    drawPile: round.drawPile,
    discardPile: round.discardPile,
    playerInTurn: round.playerInTurn,
    currentColor: round.currentColor,
    direction: round.direction,
    shuffler: round._shuffler,
    playableDrawnCardIndex: round._playableDrawnCardIndex,
    unoVulnerablePlayers: round._unoVulnerablePlayers,
    declaredUnoPlayer: round._declaredUnoPlayer,
  }
}

function replaceAt<T>(items: ReadonlyArray<T>, index: number, value: T): ReadonlyArray<T> {
  return items.map((item, current) => current === index ? value : item)
}

const advance = (player: number, distance: number, count: number): number => ((player + distance) % count + count) % count
const isCardIndex = (index: number, size: number): boolean => Number.isInteger(index) && index >= 0 && index < size

function assertInProgress(round: Round): void {
  if (hasEnded(round) || round.playerInTurn === undefined) throw new Error('The Round has ended')
}
function assertPlayerCount(count: number): void {
  if (count < 2 || count > 10) throw new Error('A Round requires between 2 and 10 players')
}
function assertPlayerIndex(index: number, count: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new Error('Player index is out of bounds')
}
function assertStartingHandSize(cardsPerPlayer: number, playerCount: number): void {
  if (!Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 0 || cardsPerPlayer * playerCount >= 108) throw new Error('Invalid starting hand size')
}
function assertDealer(dealer: number): void {
  if (!Number.isInteger(dealer)) throw new Error('Dealer must be an integer')
}

function copyCard(card: Card): Card {
  if (card.type === 'NUMBERED') return { type: card.type, color: card.color, number: card.number }
  if (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW') return { type: card.type, color: card.color } as Card
  return { type: card.type } as Card
}
