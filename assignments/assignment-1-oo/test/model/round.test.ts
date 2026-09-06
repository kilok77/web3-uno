import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import type { Card } from "../../src/model/deck"

function initialDiscardOf(type: "NUMBERED" | "DRAW" | "REVERSE") {
  return (cards: Card[]) => {
    const discardIndex = 4 * 7
    const match = cards.findIndex(card => card.type === type)
    const [card] = cards.splice(match, 1)
    cards.splice(discardIndex, 0, card)
  }
}

describe("Round initialization details", () => {
  it("derives the current color from the initial discard", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 1,
      shuffler: initialDiscardOf("NUMBERED"),
    })

    const discard = round.discardPile().top()
    if (discard === undefined || !("color" in discard)) {
      throw new Error("Expected a colored initial discard")
    }

    expect(round.currentColor()).toBe(discard.color)
  })

  it("changes direction for an initial Reverse", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 1,
      shuffler: initialDiscardOf("REVERSE"),
    })

    expect(round.currentDirection()).toBe("counterclockwise")
  })

  it("advances past the penalized player after an initial Draw Two", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 1,
      shuffler: initialDiscardOf("DRAW"),
    })

    expect(round.playerHand(2)).toHaveLength(9)
    expect(round.playerInTurn()).toBe(3)
  })
})
