import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import { shuffleBuilder } from "../../__test__/utils/shuffling"

describe("Round legality queries", () => {
  it("canPlayAny detects a compatible card", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "GREEN", number: 2 })
      .hand(0).is({ type: "NUMBERED", color: "GREEN", number: 7 })
      .build()
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler,
    })

    expect(round.canPlayAny()).toBe(true)
  })

  it("canPlayAny returns false when no held card is compatible", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "GREEN", number: 2 })
      .hand(0).is(
        { type: "NUMBERED", color: "BLUE", number: 0 },
        { type: "NUMBERED", color: "RED", number: 3 },
        { type: "NUMBERED", color: "YELLOW", number: 7 },
        { type: "DRAW", color: "BLUE" },
        { type: "REVERSE", color: "RED" },
        { type: "SKIP", color: "YELLOW" },
        { type: "NUMBERED", color: "BLUE", number: 9 },
      )
      .build()
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler,
    })

    expect(round.canPlayAny()).toBe(false)
  })

  it("does not mutate round state while answering legality", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "GREEN", number: 2 })
      .hand(0).is({ type: "WILD" })
      .build()
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler,
    })
    const handBefore = [...round.playerHand(0)]
    const drawPileBefore = round.drawPile().toMemento()
    const discardPileBefore = round.discardPile().toMemento()

    expect(round.canPlay(0)).toBe(true)
    expect(round.canPlayAny()).toBe(true)
    expect(round.playerHand(0)).toEqual(handBefore)
    expect(round.drawPile().toMemento()).toEqual(drawPileBefore)
    expect(round.discardPile().toMemento()).toEqual(discardPileBefore)
    expect(round.playerInTurn()).toBe(0)
  })
})
