import { beforeEach, describe, expect, it } from "@jest/globals"

import { createRound } from "../utils/test_adapter"
import type { Round } from "../../src/model/round"
import { shuffleBuilder } from "../utils/shuffling"
import { is } from "../utils/predicates"

describe("Playing a card", () => {
  it("throws on illegal plays", () => {
    const shuffler = shuffleBuilder()
      .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
      .hand(0).is({ type: "NUMBERED", color: "RED", number: 3 })
      .build()
    const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

    expect(() => round.play(0)).toThrow()
  })

  describe("Playing a numbered card", () => {
    let round: Round = undefined as any

    beforeEach(() => {
      const shuffler = shuffleBuilder()
        .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
        .hand(0).is({ type: "NUMBERED", color: "BLUE", number: 3 })
        .build()
      round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })
    })

    it("removes the card from the players hand", () => {
      round.play(0)
      expect(round.playerHand(0).length).toEqual(6)
    })

    it("places the card on the discard pile", () => {
      const card = round.play(0)
      expect(round.discardPile().top()).toEqual(card)
    })

    it("moves the action to the next hand", () => {
      expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(1)
    })

    it("changes color to the played color", () => {
      const shuffler = shuffleBuilder()
        .discard().is({ type: "NUMBERED", color: "BLUE", number: 6 })
        .hand(0).is({ type: "NUMBERED", color: "RED", number: 6 })
        .hand(1).is({ color: "RED" })
        .build()
      const testRound = createRound({
        players: ["a", "b", "c", "d"],
        dealer: 3,
        shuffler,
      })

      testRound.play(0)
      expect(testRound.canPlay(0)).toBeTruthy()
    })
  })

  describe("Boundaries", () => {
    it("is illegal to play a non-existant card", () => {
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3 })
      expect(() => round.play(-1)).toThrow()
      expect(() => round.play(7)).toThrow()
    })

    it("is illegal to name a color on a colored card", () => {
      const shuffler = shuffleBuilder()
        .discard().is({ type: "NUMBERED", color: "BLUE" })
        .hand(0).is({ color: "BLUE" })
        .build()
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

      expect(() => round.play(0, "YELLOW")).toThrow()
    })

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
})

describe("Drawing a card", () => {
  describe("can play any", () => {
    it("returns true if the player has a playable card", () => {
      const shuffler = shuffleBuilder()
        .discard().is({ type: "NUMBERED", color: "BLUE" })
        .hand(0).is({ color: "BLUE" })
        .build()
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

      expect(round.canPlayAny()).toBeTruthy()
    })

    it("returns false if the player has a playable card", () => {
      const shuffler = shuffleBuilder()
        .discard().is({ type: "NUMBERED", color: "BLUE", number: 0 })
        .hand(0).is(
          { type: "NUMBERED", color: "RED", number: 1 },
          { type: "NUMBERED", color: "YELLOW", number: 2 },
          { type: "NUMBERED", color: "RED", number: 3 },
          { type: "NUMBERED", color: "GREEN", number: 4 },
          { type: "SKIP", color: "RED" },
          { type: "REVERSE", color: "GREEN" },
          { type: "DRAW", color: "YELLOW" },
        )
        .build()
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

      expect(round.canPlayAny()).toBeFalsy()
    })
  })

  describe("draw", () => {
    let builder = shuffleBuilder()

    beforeEach(() => {
      builder = shuffleBuilder()
        .discard().is({ type: "NUMBERED", color: "BLUE", number: 0 })
        .hand(0).is(
          { type: "NUMBERED", color: "RED", number: 1 },
          { type: "NUMBERED", color: "YELLOW", number: 2 },
          { type: "NUMBERED", color: "RED", number: 3 },
          { type: "NUMBERED", color: "GREEN", number: 4 },
          { type: "SKIP", color: "RED" },
          { type: "REVERSE", color: "GREEN" },
          { type: "DRAW", color: "YELLOW" },
        )
    })

    it("adds the drawn card to the hand", () => {
      const round = createRound({
        players: ["a", "b", "c", "d"],
        dealer: 3,
        shuffler: builder.build(),
      })

      round.draw()
      expect(round.playerHand(0).length).toEqual(8)
    })

    it("adds the top of the draw pile to the end of the hand", () => {
      const shuffler = builder.drawPile().is({ type: "DRAW", color: "GREEN" }).build()
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

      round.draw()
      expect(is({ type: "DRAW", color: "GREEN" })(round.playerHand(0).at(7))).toBeTruthy()
    })

    it("moves to the next player if the card is unplayable", () => {
      const shuffler = builder.drawPile().is({ type: "DRAW", color: "GREEN" }).build()
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

      round.draw()
      expect(round.playerInTurn()).toBe(1)
    })

    it("doesn't move to the next player if the card is playable", () => {
      const shuffler = builder.drawPile().is({ type: "DRAW", color: "BLUE" }).build()
      const round = createRound({ players: ["a", "b", "c", "d"], dealer: 3, shuffler })

      round.draw()
      expect(round.playerInTurn()).toBe(0)
    })
  })
})
