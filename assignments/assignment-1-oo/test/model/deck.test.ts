import { describe, expect, it } from "@jest/globals"

import { createDeckFromMemento } from "../../src/model/deck"

describe("Deck pile behavior not isolated by the supplied Deck test", () => {
  it("exposes the first card through top and peek without removing it", () => {
    const deck = createDeckFromMemento([
      { type: "SKIP", color: "RED" },
      { type: "WILD" },
    ])

    expect(deck.top()).toEqual({ type: "SKIP", color: "RED" })
    expect(deck.peek()).toEqual({ type: "SKIP", color: "RED" })
    expect(deck.size).toBe(2)
  })

  it("returns undefined from top and peek when empty", () => {
    const deck = createDeckFromMemento([])

    expect(deck.top()).toBeUndefined()
    expect(deck.peek()).toBeUndefined()
  })

  it("filters without consuming or reordering the source deck", () => {
    const deck = createDeckFromMemento([
      { type: "NUMBERED", color: "BLUE", number: 3 },
      { type: "SKIP", color: "RED" },
      { type: "NUMBERED", color: "BLUE", number: 8 },
    ])

    const blueCards = deck.filter(card =>
      "color" in card && card.color === "BLUE",
    )

    expect(blueCards.toMemento()).toEqual([
      { type: "NUMBERED", color: "BLUE", number: 3 },
      { type: "NUMBERED", color: "BLUE", number: 8 },
    ])
    expect(deck.size).toBe(3)
    expect(deck.top()).toEqual({ type: "NUMBERED", color: "BLUE", number: 3 })
  })
})
