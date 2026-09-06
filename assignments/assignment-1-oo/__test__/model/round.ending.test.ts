import { describe, expect, it, test } from "@jest/globals"

import { createRound } from "../utils/test_adapter"
import { shuffleBuilder } from "../utils/shuffling"
describe("ending the hand", () => {
  describe("before playing the last card", () => {
    const shuffler = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
      .hand(1).is({ type: 'NUMBERED', color: 'GREEN', number: 4 })
      .build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    it("returns false from hasEnded()", () => {
      expect(round.hasEnded()).toBeFalsy()
    })
    it("doesn't return a winner", () => {
      expect(round.winner()).toBeUndefined();
    })
  })

  describe("playing the last card", () => {
    const shuffler = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
      .hand(1).is({ type: 'NUMBERED', color: 'GREEN', number: 4 })
      .build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    it("returns true from hasEnded()", () => {
      expect(round.hasEnded()).toBeTruthy()
    })
    it("returns the winner", () => {
      expect(round.winner()).toEqual(0);
    })
    it("makes the player in turn undefined", () => {
      expect(round.playerInTurn()).toBeUndefined()
    })
    it("ceases play", () => {
      expect(round.canPlay(0)).toBeFalsy()
      expect(round.canPlayAny()).toBeFalsy()
    })
    it("gives error on attempted play", () => {
      expect(() => round.play(0)).toThrow()
    })
    it("gives error on attempted draw", () => {
      expect(() => round.draw()).toThrow()
    })
    it("gives error on attempting to say 'UNO!'", () => {
      expect(() => round.sayUno(1)).toThrow()
    })
  })
})

describe("score", () => {
  const builder = shuffleBuilder({ players: 2, cardsPerPlayer: 1 })
    .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
    .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
  it("is undefined before the last card is played", () => {
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    expect(round.score()).toBeUndefined()
  })
  it("is defined after the last card is played", () => {
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toBeDefined()
  })
  it("has the value of the card number if the opponent holds a numbered card", () => {
    for(let number = 0; number <= 9; number++) {
      builder.hand(1).is({type: 'NUMBERED', number})
      const shuffler = builder.build()
      const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
      round.play(0)
      expect(round.score()).toEqual(number)
    }
  })
  it("has the value 20 if the opponent holds a draw card", () => {
    builder.hand(1).is({type: 'DRAW'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(20)
  })
  it("has the value 20 if the opponent holds a reverse card", () => {
    builder.hand(1).is({type: 'REVERSE'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(20)
  })
  it("has the value 20 if the opponent holds a skip card", () => {
    builder.hand(1).is({type: 'SKIP'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(20)
  })
  it("has the value 50 if the opponent holds a wild card", () => {
    builder.hand(1).is({type: 'WILD'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(50)
  })
  it("has the value 50 if the opponent holds a wild draw card", () => {
    builder.hand(1).is({type: 'WILD DRAW'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(50)
  })
  it("adds the cards if the opponent have more than one card", () => {
    builder.hand(0).is({color: 'BLUE', type: 'DRAW'})
    builder.hand(1).is({type: 'WILD DRAW'})
    builder.drawPile().is({number: 5}, {type: 'REVERSE'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.playerHand(1).length).toEqual(3)
    expect(round.score()).toEqual(75)
  })
  it("adds the cards of all opponents if there are more than 2 players", () => {
    const builder = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({color: 'BLUE', type: 'DRAW'})
      .hand(1).is({type: 'WILD DRAW'})
      .hand(2).is({number: 7})
      .hand(3).is({number: 3})
      .drawPile().is({number: 5}, {type: 'REVERSE'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.playerHand(1).length).toEqual(3)
    expect(round.score()).toEqual(85)
  })
})

describe("callback", () => {
  const builder = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
    .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
    .drawPile().is({number: 8})
    .hand(0).is({color: 'GREEN', type: 'DRAW'})
    .hand(1).is({type: 'WILD DRAW'})
    .hand(2).is({number: 7})
    .hand(3).is({number: 3})
  const shuffler = builder.build()
  test("callback gets called at the end of the hand", () => {
    const events: any[] = []
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.onEnd(e => events.push(e))
    round.draw()
    round.play(1)
    round.play(0, 'YELLOW')
    expect(events).toEqual([{winner: 1}])
  })
  test("all callbacks get called at the end of the hand", () => {
    const events: any[] = []
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.onEnd(e => events.push(e))
    round.onEnd(e => events.push(e))
    round.draw()
    round.play(1)
    round.play(0, 'YELLOW')
    expect(events).toEqual([{winner: 1}, {winner: 1}])
  })
})
