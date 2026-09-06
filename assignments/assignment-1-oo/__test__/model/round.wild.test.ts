import { beforeEach, describe, expect, it } from "@jest/globals"

import { createRound } from "../utils/test_adapter"
import type { Round } from "../../src/model/round"
import { shuffleBuilder } from "../utils/shuffling"

describe("Playing a wild card", () => {
  let builder = shuffleBuilder()

  beforeEach(() => {
    builder = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "WILD" })
  })

  it("moves the action to the next hand", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0, "RED")
    expect(round.playerInTurn()).toEqual(1)
  })

  it("changes color to the chosen color", () => {
    builder.hand(1).is({ color: "RED" })
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    round.play(0, "RED")
    expect(round.canPlay(0)).toBeTruthy()
  })
})

describe("Playing a wild draw card", () => {
  let builder = shuffleBuilder()

  beforeEach(() => {
    builder = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "WILD DRAW" })
      .repeat(6).isnt({ color: "BLUE" })
  })

  it("skips the next player", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0, "RED")
    expect(round.playerInTurn()).toEqual(2)
  })

  it("gives the next player 4 cards", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    round.play(0, "RED")
    expect(round.playerHand(1).length).toEqual(11)
  })

  it("takes the 4 cards from the draw pile", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })
    const pileSize = round.drawPile().size

    round.play(0, "RED")
    expect(round.drawPile().size).toEqual(pileSize - 4)
  })

  it("changes color to the chosen color", () => {
    builder.hand(2).is({ color: "RED" })
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    round.play(0, "RED")
    expect(round.canPlay(0)).toBeTruthy()
  })
})

describe("Wild color boundaries", () => {
  it("is illegal not to name a color on a wild card", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE" })
      .hand(0).is({ type: "WILD" })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    expect(() => round.play(0)).toThrow()
  })

  it("is illegal not to name a color on a wild draw card", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE" })
      .hand(0).is({ type: "WILD DRAW" })
      .repeat(6).isnt({ color: "BLUE" })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    expect(() => round.play(0)).toThrow()
  })
})
