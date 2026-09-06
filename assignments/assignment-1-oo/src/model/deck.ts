/** The four colors permanently carried by colored UNO cards. */
export const colors = ["BLUE", "GREEN", "RED", "YELLOW"] as const

export type Color = (typeof colors)[number]

/** The test-facing names of every supported UNO card kind. */
export type Type =
  | "NUMBERED"
  | "SKIP"
  | "REVERSE"
  | "DRAW"
  | "WILD"
  | "WILD DRAW"

export type CardNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type NumberedCard = {
  readonly type: "NUMBERED"
  readonly color: Color
  readonly number: CardNumber
}

type ColoredActionType = "SKIP" | "REVERSE" | "DRAW"

type ColoredActionCard = {
  readonly [T in ColoredActionType]: {
    readonly type: T
    readonly color: Color
  }
}[ColoredActionType]

/** Every card with an intrinsic color. Wild cards are deliberately excluded. */
export type ColoredCard = NumberedCard | ColoredActionCard

export type WildCard =
  | { readonly type: "WILD" }
  | { readonly type: "WILD DRAW" }

export type Card = ColoredCard | WildCard

/** Selects the member of Card carrying the requested discriminant. */
export type TypedCard<T extends Type> = Extract<Card, { readonly type: T }>

/** Checks both that a card is colored and that it carries the requested color. */
export function hasColor<C extends Color>(
  card: Card,
  color: C,
): card is ColoredCard & { readonly color: C } {
  return "color" in card && card.color === color
}

/** Checks both that a card is numbered and that it carries the requested number. */
export function hasNumber<N extends CardNumber>(
  card: Card,
  number: N,
): card is NumberedCard & { readonly number: N }
export function hasNumber(card: Card, number: number): card is NumberedCard
export function hasNumber(card: Card, number: number): card is NumberedCard {
  return card.type === "NUMBERED" && card.number === number
}

export type DeckMemento = Card[]

export type CardPredicate = (card: Card) => boolean

export type CardShuffler = (cards: Card[]) => void

/** A mutable pile whose first element is its observable top. */
export class Deck {
  readonly #cards: Card[]

  constructor(cards: readonly Card[] = []) {
    this.#cards = [...cards]
  }

  get size(): number {
    return this.#cards.length
  }

  filter(predicate: CardPredicate): Deck {
    return new Deck(this.#cards.filter(predicate))
  }

  shuffle(shuffler: CardShuffler): void {
    shuffler(this.#cards)
  }

  deal(): Card | undefined {
    return this.#cards.shift()
  }

  top(): Card | undefined {
    return this.#cards[0]
  }

  peek(): Card | undefined {
    return this.top()
  }

  toMemento(): DeckMemento {
    return this.#cards.map(copyCard)
  }
}

const numberedValues = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const coloredActionTypes = ["SKIP", "REVERSE", "DRAW"] as const

export function createInitialDeck(): Deck {
  const cards: Card[] = []

  for (const color of colors) {
    cards.push({ type: "NUMBERED", color, number: 0 })

    for (const number of numberedValues) {
      cards.push(
        { type: "NUMBERED", color, number },
        { type: "NUMBERED", color, number },
      )
    }

    for (const type of coloredActionTypes) {
      cards.push({ type, color }, { type, color })
    }
  }

  for (let copy = 0; copy < 4; copy += 1) {
    cards.push({ type: "WILD" }, { type: "WILD DRAW" })
  }

  return new Deck(cards)
}

export function createDeckFromMemento(memento: unknown): Deck {
  if (!Array.isArray(memento)) {
    throw new Error("A Deck memento must be an array")
  }

  return new Deck(memento.map(cardFromMemento))
}

function cardFromMemento(value: unknown): Card {
  if (!isRecord(value)) {
    throw new Error("Every Deck memento entry must be a card object")
  }

  switch (value.type) {
    case "NUMBERED":
      if (!isColor(value.color) || !isCardNumber(value.number)) {
        throw new Error("A numbered card requires a valid color and number")
      }
      return { type: "NUMBERED", color: value.color, number: value.number }

    case "SKIP":
    case "REVERSE":
    case "DRAW":
      if (!isColor(value.color)) {
        throw new Error("A colored action card requires a valid color")
      }
      return { type: value.type, color: value.color }

    case "WILD":
      return { type: "WILD" }

    case "WILD DRAW":
      return { type: "WILD DRAW" }

    default:
      throw new Error("Unknown UNO card type")
  }
}

function copyCard(card: Card): Card {
  switch (card.type) {
    case "NUMBERED":
      return { type: card.type, color: card.color, number: card.number }
    case "SKIP":
    case "REVERSE":
    case "DRAW":
      return { type: card.type, color: card.color }
    case "WILD":
    case "WILD DRAW":
      return { type: card.type }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isColor(value: unknown): value is Color {
  return colors.some(color => color === value)
}

function isCardNumber(value: unknown): value is CardNumber {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= 9
}
