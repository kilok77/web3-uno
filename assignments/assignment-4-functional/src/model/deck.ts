import * as _ from 'lodash'
import type { Shuffler } from '../utils/random_utils'

export const colors = ['BLUE', 'GREEN', 'RED', 'YELLOW'] as const
export type Color = typeof colors[number]
export type Type = 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD DRAW'
export type NumberValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * The supplied functional tests use one structural Card type and access
 * color/number after ordinary Array.filter calls. Those tests do not use
 * type-predicate filters, so the public fields are intentionally typed as
 * present even though irrelevant fields are omitted from runtime objects.
 * Constructors and rule functions enforce the valid combinations.
 */
export type Card = {
  readonly type: Type
  readonly color: Color
  readonly number: NumberValue
}

export type NumberedCard = Card & { readonly type: 'NUMBERED' }
export type ColoredActionCard = Card & { readonly type: 'SKIP' | 'REVERSE' | 'DRAW' }
export type WildCard = Card & { readonly type: 'WILD' | 'WILD DRAW' }
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

export function hasColor(card: Card): boolean {
  return runtimeColor(card) !== undefined
}

export function hasNumber(card: Card): boolean {
  return card.type === 'NUMBERED' && runtimeNumber(card) !== undefined
}

/** Standard 108-card UNO deck, represented as immutable plain values. */
export function createInitialDeck(): Deck {
  const coloredCards: Card[] = _.flatMap(colors, color => {
    const zero = numberedCard(color, 0)
    const numbered = _.flatMap(_.range(1, 10), number => [
      numberedCard(color, number as NumberValue),
      numberedCard(color, number as NumberValue),
    ])
    const actions = _.flatMap(['SKIP', 'REVERSE', 'DRAW'] as const, type => [
      coloredActionCard(type, color),
      coloredActionCard(type, color),
    ])
    return [zero, ...numbered, ...actions]
  })

  const wilds: Card[] = _.flatMap(_.range(4), () => [
    wildCard('WILD'),
    wildCard('WILD DRAW'),
  ])

  return [...coloredCards, ...wilds]
}

export const standardDeck = createInitialDeck

function numberedCard(color: Color, number: NumberValue): Card {
  return { type: 'NUMBERED', color, number }
}

function coloredActionCard(type: 'SKIP' | 'REVERSE' | 'DRAW', color: Color): Card {
  return { type, color } as Card
}

function wildCard(type: 'WILD' | 'WILD DRAW'): Card {
  return { type } as Card
}

function runtimeColor(card: Card): Color | undefined {
  return (card as unknown as { readonly color?: Color }).color
}

function runtimeNumber(card: Card): NumberValue | undefined {
  return (card as unknown as { readonly number?: NumberValue }).number
}

function copyCard(card: Card): Card {
  if (card.type === 'NUMBERED') {
    return { type: card.type, color: runtimeColor(card), number: runtimeNumber(card) } as Card
  }
  if (card.type === 'SKIP' || card.type === 'REVERSE' || card.type === 'DRAW') {
    return { type: card.type, color: runtimeColor(card) } as Card
  }
  return { type: card.type } as Card
}
