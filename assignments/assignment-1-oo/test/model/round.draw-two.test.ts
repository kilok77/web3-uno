import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import { shuffleBuilder } from "../../__test__/utils/shuffling"

describe("Draw Two state", () => {
  it("penalizes the opponent and returns play to the actor with two players", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 7 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is(
        { type: "DRAW", color: "BLUE" },
        { type: "NUMBERED", color: "BLUE", number: 3 },
      )
      .drawPile().is(
        { type: "NUMBERED", color: "BLUE", number: 4 },
        { type: "NUMBERED", color: "BLUE", number: 5 },
      )
      .build()
    const round = createRound({ players: ["a", "b"], dealer: 1, shuffler })
    const drawPileSize = round.drawPile().size

    const played = round.play(0)

    expect(round.playerHand(0)).toHaveLength(6)
    expect(round.playerHand(1)).toHaveLength(9)
    expect(round.drawPile().size).toBe(drawPileSize - 2)
    expect(round.playerInTurn()).toBe(0)
    expect(round.discardPile().top()).toEqual(played)
    expect(round.currentColor()).toBe("BLUE")
  })

  it("does not treat forced penalty cards as a voluntary playable draw", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 7 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is(
        { type: "DRAW", color: "BLUE" },
        { type: "NUMBERED", color: "BLUE", number: 3 },
      )
      .drawPile().is(
        { type: "NUMBERED", color: "BLUE", number: 4 },
        { type: "NUMBERED", color: "BLUE", number: 5 },
      )
      .build()
    const round = createRound({ players: ["a", "b"], dealer: 1, shuffler })

    round.play(0)

    expect(round.canPlay(0)).toBe(true)
    expect(() => round.play(0)).not.toThrow()
  })
})
