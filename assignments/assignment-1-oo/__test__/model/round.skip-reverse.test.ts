import { beforeEach, describe, expect, it, test } from "@jest/globals"

import { createRound } from "../utils/test_adapter"
import type { Round } from "../../src/model/round"
import { shuffleBuilder } from "../utils/shuffling"

describe("Playing a skip card", () => {
  it("skips the next player", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "SKIP", color: "BLUE" })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(2)
  })
})

describe("Playing a reverse card", () => {
  let builder = shuffleBuilder()

  beforeEach(() => {
    builder = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "REVERSE", color: "BLUE" })
  })

  it("reverses the direction of play", () => {
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(3)
  })

  it("makes the reversing persistent", () => {
    builder.hand(3).is({ type: "NUMBERED", color: "BLUE" })
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(2)
  })

  it("reverses the reversing", () => {
    builder
      .hand(3).is({ type: "NUMBERED", color: "BLUE" })
      .hand(2).is({ type: "REVERSE", color: "BLUE" })
    const round = createRound({
      players: ["a", "b", "c", "d"],
      dealer: 3,
      shuffler: builder.build(),
    })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    round.play(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(3)
  })
})

describe("special 2-player rules", () => {
  test("playing a reverse card works as a skip card", () => {
    const shuffler = shuffleBuilder({ players: 2, cardsPerPlayer: 7 })
      .discard().is({ type: "NUMBERED", color: "BLUE" })
      .hand(0).is({ type: "REVERSE", color: "BLUE" })
      .build()
    const round = createRound({ players: ["a", "b"], dealer: 1, shuffler })

    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(0)
  })
})
