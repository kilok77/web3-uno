import { beforeEach, describe, expect, it } from "@jest/globals"

import { createRound } from "../utils/test_adapter"
import type { Round } from "../../src/model/round"
import { shuffleBuilder } from "../utils/shuffling"

describe("Playing a draw card", () => {
  let round: Round = undefined as any

  beforeEach(() => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "DRAW", color: "BLUE" })
      .build()
    round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })
  })

  it("skips the next player", () => {
    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(2)
  })

  it("gives the next player 2 cards", () => {
    round.play(0)
    expect(round.playerHand(1).length).toEqual(9)
  })

  it("takes the 2 cards from the draw pile", () => {
    const pileSize = round.drawPile().size
    round.play(0)
    expect(round.drawPile().size).toEqual(pileSize - 2)
  })
})
