import type { Card } from "./deck"

export type HandView = ReadonlyArray<Card>

/** Owns a player's ordered cards without applying any gameplay rules. */
export class Hand {
  readonly #cards: Card[]
  readonly #view: HandView

  constructor(cards: readonly Card[] = []) {
    this.#cards = cards.map(copyCard)
    this.#view = createReadonlyView(this.#cards)
  }

  get size(): number {
    return this.#cards.length
  }

  /** A stable, live view suitable for Round.playerHand(). */
  get cards(): HandView {
    return this.#view
  }

  at(index: number): Card | undefined {
    return this.#cards.at(index)
  }

  add(card: Card): void {
    this.#cards.push(copyCard(card))
  }

  remove(index: number): Card | undefined {
    if (!Number.isInteger(index) || index < 0 || index >= this.#cards.length) {
      return undefined
    }

    return this.#cards.splice(index, 1)[0]
  }

  toMemento(): Card[] {
    return this.#cards.map(copyCard)
  }
}

function createReadonlyView(cards: Card[]): HandView {
  return new Proxy(cards, {
    set: rejectViewMutation,
    deleteProperty: rejectViewMutation,
    defineProperty: rejectViewMutation,
  })
}

function rejectViewMutation(): never {
  throw new TypeError("A Hand view is readonly")
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
