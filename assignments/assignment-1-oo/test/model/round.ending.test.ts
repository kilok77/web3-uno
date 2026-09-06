import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import { shuffleBuilder } from "../../__test__/utils/shuffling"

describe("final action-card completion", () => {
  it("applies a final Wild Draw Four penalty before calculating score", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 1 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "WILD DRAW" })
      .hand(1).is({ type: "NUMBERED", color: "RED", number: 5 })
      .drawPile().is(
        { type: "NUMBERED", color: "GREEN", number: 1 },
        { type: "NUMBERED", color: "GREEN", number: 2 },
        { type: "NUMBERED", color: "GREEN", number: 3 },
        { type: "NUMBERED", color: "GREEN", number: 4 },
      )
      .build()
    const round = createRound({
      players: ["a", "b"],
      dealer: 1,
      cardsPerPlayer: 1,
      shuffler,
    })

    round.play(0, "GREEN")

    expect(round.hasEnded()).toBe(true)
    expect(round.winner()).toBe(0)
    expect(round.playerHand(1)).toHaveLength(5)
    expect(round.score()).toBe(15)
  })
})
