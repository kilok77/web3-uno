import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import type { Card } from "../../src/model/deck"
import type { Round } from "../../src/model/round"
import { standardShuffler, type Shuffler } from "../../src/utils/random_utils"
import { createRound } from "../utils/test_adapter"
import { is } from "../utils/predicates"
import { shuffleBuilder, successiveShufflers } from "../utils/shuffling"

function drainTo(round: Round, remaining: number): void {
  while (round.drawPile().size > remaining) round.drawPile().deal()
}

describe("drawing the last card", () => {
  let recycleShuffler: ReturnType<typeof jest.fn<Shuffler<Card>>>
  let round: Round
  let retainedTop: Card | undefined

  beforeEach(() => {
    const initialShuffle = shuffleBuilder({ players: 2, cardsPerPlayer: 1 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 8 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .build()
    recycleShuffler = jest.fn<Shuffler<Card>>(standardShuffler)
    const shuffler = successiveShufflers(initialShuffle, recycleShuffler)
    round = createRound({
      players: ["a", "b"],
      dealer: 1,
      cardsPerPlayer: 1,
      shuffler,
    })
    round.play(0)
    retainedTop = round.discardPile().top()
    drainTo(round, 1)
    round.draw()
  })

  it("shuffles to create a new draw pile", () => {
    expect(recycleShuffler).toHaveBeenCalledTimes(1)
  })

  it("retains the top card of the discard pile", () => {
    expect(round.discardPile().top()).toEqual(retainedTop)
  })

  it("leaves only the top card in the discard pile", () => {
    expect(round.discardPile().size).toEqual(1)
  })

  it("adds cards in the draw pile", () => {
    expect(round.drawPile().size).toEqual(1)
  })

  it("leaves the cards removed from the discard pile in the draw pile", () => {
    expect(is({ type: "NUMBERED", color: "BLUE", number: 8 })(
      round.drawPile().peek(),
    )).toBeTruthy()
  })
})

describe("when drawing because of a card", () => {
  it("continues a forced Draw Two across the recycling boundary", () => {
    const initialShuffle = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 3 })
      .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 5 })
      .hand(1).is({ type: "DRAW", color: "BLUE" })
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

    expect(round.playerHand(2).length).toEqual(3)
    expect(round.discardPile().size).toEqual(1)
    expect(round.drawPile().size).toEqual(1)
  })
})
