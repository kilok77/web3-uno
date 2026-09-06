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
