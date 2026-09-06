import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import { shuffleBuilder } from "../../__test__/utils/shuffling"

describe("ordinary draw turn phase", () => {
  it("allows drawing even when a pre-existing hand card is playable", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 0 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .drawPile().is({ type: "NUMBERED", color: "RED", number: 7 })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    round.draw()

    expect(round.playerHand(0)).toHaveLength(8)
    expect(round.playerInTurn()).toBe(1)
  })

  it("allows only a playable freshly drawn card during the retained turn", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 0 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .drawPile().is({ type: "NUMBERED", color: "BLUE", number: 5 })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    expect(round.canPlay(0)).toBe(true)
    round.draw()

    expect(round.playerInTurn()).toBe(0)
    expect(round.canPlay(0)).toBe(false)
    expect(round.canPlay(7)).toBe(true)
    expect(round.canPlayAny()).toBe(true)
    expect(() => round.play(0)).toThrow()

    round.play(7)
    expect(round.playerInTurn()).toBe(1)
  })
})
