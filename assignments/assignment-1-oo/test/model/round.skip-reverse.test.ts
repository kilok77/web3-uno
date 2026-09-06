import { describe, expect, it } from "@jest/globals"

import { createRound } from "../../src/model/round"
import { shuffleBuilder } from "../../__test__/utils/shuffling"

describe("Skip and Reverse state", () => {
  it("two-player Skip returns play to its actor", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 7 })
      .discard().is({ type: "NUMBERED", color: "BLUE" })
      .hand(0).is({ type: "SKIP", color: "BLUE" })
      .build()
    const round = createRound({ players: ["a", "b"], dealer: 1, shuffler })

    round.play(0)

    expect(round.playerInTurn()).toBe(0)
  })

  it("Skip uses the shared hand, discard, and color transition", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "SKIP", color: "BLUE" })
      .hand(1).is({ type: "SKIP", color: "RED" })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    const played = round.play(0)

    expect(round.playerHand(1)).toHaveLength(6)
    expect(round.discardPile().top()).toEqual(played)
    expect(round.currentColor()).toBe("RED")
  })

  it("two-player Reverse still records the reversed direction", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 7 })
      .discard().is({ type: "NUMBERED", color: "BLUE" })
      .hand(0).is({ type: "REVERSE", color: "BLUE" })
      .build()
    const round = createRound({ players: ["a", "b"], dealer: 1, shuffler })

    round.play(0)

    expect(round.currentDirection()).toBe("counterclockwise")
    expect(round.playerInTurn()).toBe(0)
  })
})
