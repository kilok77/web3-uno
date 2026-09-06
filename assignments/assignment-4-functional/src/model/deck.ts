import * as _ from 'lodash'
import type { Shuffler } from '../utils/random_utils'

export const colors = ['BLUE', 'GREEN', 'RED', 'YELLOW'] as const
export type Color = typeof colors[number]
export type Type = 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD DRAW'
export type NumberValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * The supplied functional tests use one structural card type and inspect
 * optional fields after ordinary Array.filter calls. Keep that public shape
 * while constructors and rule predicates enforce the valid combinations.
 */
export type Card = {
  readonly type: Type
  readonly color?: Color
  readonly number?: NumberValue
}

export type NumberedCard = Card & {
  readonly type: 'NUMBERED'
  readonly color: Color
  readonly number: NumberValue
}

export type ColoredActionCard = Card & {
  readonly type: 'SKIP' | 'REVERSE' | 'DRAW'
  readonly color: Color
  readonly number?: undefined
}

export type WildCard = Card & {
  readonly type: 'WILD' | 'WILD DRAW'
  readonly color?: undefined
  readonly number?: undefined
}

export type TypedCard<T extends Type> = Card & { readonly type: T }
export type Deck = ReadonlyArray<Card>

export const createDeck = (cards: ReadonlyArray<Card> = []): Deck => cards.map(copyCard)
export const size = (deck: Deck): number => deck.length
export const top = (deck: Deck): Card | undefined => deck[0]
export const toMemento = (deck: Deck): Card[] => deck.map(copyCard)

export function filter(predicate: (card: Card) => boolean, deck: Deck): Deck {
  return deck.filter(predicate).map(copyCard)
}

export function shuffle(shuffler: Shuffler<Card>, deck: Deck): Deck {
  return shuffler(deck.map(copyCard)).map(copyCard)
}

export function deal(deck: Deck): readonly [Card | undefined, Deck] {
  const [card, ...remaining] = deck
  return [card === undefined ? undefined : copyCard(card), remaining.map(copyCard)]
}

export function hasColor(card: Card): card is Card & { readonly color: Color } {
  return card.color !== undefined
}

export function hasNumber(card: Card): card is NumberedCard {
  return card.type === 'NUMBERED' && card.color !== undefined && card.number !== undefined
}

/** Standard 108-card UNO deck, represented as immutable plain values. */
export function createInitialDeck(): Deck {
  const coloredCards = _.flatMap(colors, color => {
    const zero: NumberedCard = { type: 'NUMBERED', color, number: 0 }
    const numbered = _.flatMap(_.range(1, 10), number => [
      { type: 'NUMBERED', color, number: number as NumberValue } satisfies NumberedCard,
      { type: 'NUMBERED', color, number: number as NumberValue } satisfies NumberedCard,
    ])
    const actions = _.flatMap(['SKIP', 'REVERSE', 'DRAW'] as const, type => [
      { type, color } satisfies ColoredActionCard,
      { type, color } satisfies ColoredActionCard,
    ])
    return [zero, ...numbered, ...actions]
  })

  const wilds: Card[] = _.flatMap(_.range(4), () => [
    { type: 'WILD' } as Card,
    { type: 'WILD DRAW' } as Card,
  ])

  return [...coloredCards, ...wilds]
}

export const standardDeck = createInitialDeck

function copyCard(card: Card): Card {
  if (card.type === 'NUMBERED') {
    return { type: card.type, color: card.color, number: card.number }
  }
  if (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW') {
    return { type: card.type, color: card.color }
  }
  return { type: card.type }
}
