import { describe, expect, it } from "@jest/globals"

import { Hand } from "../../src/model/hand"
import type { Card } from "../../src/model/deck"

const blueOne: Card = { type: "NUMBERED", color: "BLUE", number: 1 }
const redSkip: Card = { type: "SKIP", color: "RED" }
const wild: Card = { type: "WILD" }

describe("Hand", () => {
  it("preserves card order and defensively copies its input array", () => {
    const cards: Card[] = [blueOne, redSkip]
    const hand = new Hand(cards)

    cards.push(wild)

    expect(hand.size).toBe(2)
    expect(hand.at(0)).toEqual(blueOne)
    expect(hand.at(1)).toEqual(redSkip)
  })

  it("provides one stable view that reflects later changes", () => {
    const hand = new Hand([blueOne])
    const view = hand.cards

    hand.add(redSkip)

    expect(hand.cards).toBe(view)
    expect(view.length).toBe(2)
    expect(view.at(1)).toEqual(redSkip)
  })

  it("supports the array iteration observed by the supplied Round tests", () => {
    const visited: Card[] = []
    new Hand([blueOne, redSkip]).cards.forEach(card => visited.push(card))

    expect(visited).toEqual([blueOne, redSkip])
  })

  it("appends cards and removes a card by zero-based index", () => {
    const hand = new Hand([blueOne, redSkip])

    hand.add(wild)
    const removed = hand.remove(1)

    expect(removed).toEqual(redSkip)
    expect(hand.toMemento()).toEqual([blueOne, wild])
  })

  it.each([-1, 2, 0.5])("does not mutate for invalid removal index %s", index => {
    const hand = new Hand([blueOne, redSkip])

    expect(hand.remove(index)).toBeUndefined()
    expect(hand.toMemento()).toEqual([blueOne, redSkip])
  })

  it("returns undefined when removing from an empty hand", () => {
    expect(new Hand().remove(0)).toBeUndefined()
  })

  it("returns a defensive ordered memento", () => {
    const hand = new Hand([blueOne, redSkip])
    const memento = hand.toMemento()

    memento.shift()

    expect(hand.toMemento()).toEqual([blueOne, redSkip])
  })

  it("prevents mutation through its public view", () => {
    const hand = new Hand([blueOne])

    expect(() => (hand.cards as Card[]).push(redSkip)).toThrow(TypeError)
    expect(hand.toMemento()).toEqual([blueOne])
  })
})
