import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import { shuffleBuilder, successiveShufflers } from "../../__test__/utils/shuffling"

function drainTo(round: ReturnType<typeof createRound>, remaining: number): void {
  while (round.drawPile().size > remaining) round.drawPile().deal()
}

describe("draw-pile recycling invariants", () => {
  it("conserves cards while retaining the current discard top", () => {
    const initialShuffle = shuffleBuilder({ players: 2, cardsPerPlayer: 1 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 8 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .build()
    const round = createRound({
      players: ["a", "b"],
      dealer: 1,
      cardsPerPlayer: 1,
      shuffler: successiveShufflers(initialShuffle),
    })
    round.play(0)
    drainTo(round, 1)
    const top = round.discardPile().top()
    const cardCountBefore = round.playerHand(0).length
      + round.playerHand(1).length
      + round.drawPile().size
      + round.discardPile().size

    round.draw()

    const cardCountAfter = round.playerHand(0).length
      + round.playerHand(1).length
      + round.drawPile().size
      + round.discardPile().size
    expect(cardCountAfter).toBe(cardCountBefore)
    expect(round.discardPile().top()).toEqual(top)
  })

  it("does not create voluntary-draw state during a recycled penalty", () => {
    const initialShuffle = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 5 })
      .hand(1).is({ type: "DRAW", color: "BLUE" })
      .hand(3).is({ type: "NUMBERED", color: "BLUE", number: 9 })
      .build()
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      cardsPerPlayer: 1,
      shuffler: successiveShufflers(initialShuffle),
    })
    round.play(0)
    drainTo(round, 1)

    round.play(0)

    expect(round.playerInTurn()).toBe(3)
    expect(round.canPlay(0)).toBe(true)
  })

  it("continues a two-player Wild Draw Four across recycling", () => {
    const initialShuffle = shuffleBuilder({ players: 2, cardsPerPlayer: 2 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 5 })
      .hand(1).is(
        { type: "WILD DRAW" },
        { type: "NUMBERED", color: "RED", number: 7 },
      )
      .build()
    const round = createRound({
      players: ["a", "b"],
      dealer: 1,
      cardsPerPlayer: 2,
      shuffler: successiveShufflers(initialShuffle),
    })
    round.play(0)
    drainTo(round, 2)

    round.play(0, "RED")

    expect(round.playerHand(0)).toHaveLength(5)
    expect(round.playerInTurn()).toBe(1)
    expect(round.discardPile().size).toBe(1)
    expect(round.canPlay(0)).toBe(true)
  })
})
