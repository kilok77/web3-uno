import * as _ from 'lodash'
import type { Shuffler } from '../utils/random_utils'

export const colors = ['BLUE', 'GREEN', 'RED', 'YELLOW'] as const
export type Color = typeof colors[number]

export type NumberedCard = {
  readonly type: 'NUMBERED'
  readonly color: Color
  readonly number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
}

export type ColoredActionCard = {
  readonly type: 'SKIP' | 'REVERSE' | 'DRAW'
  readonly color: Color
}

export type WildCard = {
  readonly type: 'WILD' | 'WILD DRAW'
}

export type Card = NumberedCard | ColoredActionCard | WildCard
export type Type = Card['type']
export type TypedCard<T extends Type> = Extract<Card, { readonly type: T }>
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

export function hasColor(card: Card): card is Extract<Card, { readonly color: Color }> {
  return 'color' in card
}

export function hasNumber(card: Card): card is NumberedCard {
  return card.type === 'NUMBERED'
}

/** Standard 108-card UNO deck, represented as immutable plain values. */
export function createInitialDeck(): Deck {
  const coloredCards = _.flatMap(colors, color => {
    const zero: NumberedCard = { type: 'NUMBERED', color, number: 0 }
    const numbered = _.flatMap(_.range(1, 10), number => [
      { type: 'NUMBERED', color, number } as NumberedCard,
      { type: 'NUMBERED', color, number } as NumberedCard,
    ])
    const actions = _.flatMap(['SKIP', 'REVERSE', 'DRAW'] as const, type => [
      { type, color } as ColoredActionCard,
      { type, color } as ColoredActionCard,
    ])
    return [zero, ...numbered, ...actions]
  })

  const wilds = _.flatMap(_.range(4), () => [
    { type: 'WILD' } as const,
    { type: 'WILD DRAW' } as const,
  ])

  return [...coloredCards, ...wilds]
}

export const standardDeck = createInitialDeck

function copyCard(card: Card): Card {
  switch (card.type) {
    case 'NUMBERED':
      return { type: 'NUMBERED', color: card.color, number: card.number }
    case 'SKIP':
    case 'REVERSE':
    case 'DRAW':
      return { type: card.type, color: card.color }
    case 'WILD':
      return { type: 'WILD' }
    case 'WILD DRAW':
      return { type: 'WILD DRAW' }
  }
}
