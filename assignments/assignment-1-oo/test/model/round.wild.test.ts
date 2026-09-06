import { describe, expect, it } from "@jest/globals"

import type { Color } from "../../src/model/deck"
import { createRound } from "../../src/model/round"
import { shuffleBuilder } from "../../__test__/utils/shuffling"

describe("Wild gameplay state", () => {
  it("removes and discards an ordinary Wild while preserving its chosen color separately", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "WILD" })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    const played = round.play(0, "RED")

    expect(round.playerHand(0)).toHaveLength(6)
    expect(round.discardPile().top()).toEqual({ type: "WILD" })
    expect(played).toEqual({ type: "WILD" })
    expect(round.currentColor()).toBe("RED")
  })

  it("rejects an invalid runtime color without mutating the hand", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "WILD" })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    expect(() => round.play(0, "PURPLE" as Color)).toThrow()
    expect(round.playerHand(0)).toHaveLength(7)
    expect(round.currentColor()).toBe("BLUE")
  })

  it("penalizes the opponent and returns play to the actor in two-player Wild Draw Four", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 7 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0)
        .is({ type: "WILD DRAW" })
        .is({ type: "NUMBERED", color: "RED", number: 5 })
        .repeat(5).isnt({ color: "BLUE" })
      .drawPile().is(
        { type: "NUMBERED", color: "RED", number: 1 },
        { type: "NUMBERED", color: "RED", number: 2 },
        { type: "NUMBERED", color: "RED", number: 3 },
        { type: "NUMBERED", color: "RED", number: 4 },
      )
      .build()
    const round = createRound({ players: ["a", "b"], dealer: 1, shuffler })

    round.play(0, "RED")

    expect(round.playerHand(1)).toHaveLength(11)
    expect(round.playerInTurn()).toBe(0)
    expect(round.currentColor()).toBe("RED")
    expect(round.canPlay(0)).toBe(true)
  })
})
