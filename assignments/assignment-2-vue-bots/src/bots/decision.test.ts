import { describe, expect, it } from "vitest"
import { decideBotTurn, chooseWildColor } from "./decision"
import type { RoundMemento } from "../domain/model/round"

function roundWithBotHand(
  botHand: RoundMemento["hands"][number],
  currentColor: RoundMemento["currentColor"] = "RED",
): RoundMemento {
  return {
    players: ["Human", "Bot 1"],
    hands: [[{ type: "NUMBERED", color: "YELLOW", number: 9 }], botHand],
    drawPile: [{ type: "NUMBERED", color: "GREEN", number: 1 }],
    discardPile: [{ type: "NUMBERED", color: currentColor, number: 5 }],
    currentColor,
    currentDirection: "clockwise",
    dealer: 0,
    playerInTurn: 1,
  }
}

describe("bot decisions", () => {
  it("plays the first legal card", () => {
    const decision = decideBotTurn({
      type: "TAKE_TURN",
      requestId: 1,
      playerIndex: 1,
      round: roundWithBotHand([
        { type: "NUMBERED", color: "BLUE", number: 5 },
        { type: "NUMBERED", color: "GREEN", number: 8 },
      ]),
    }, () => 0)

    expect(decision.action).toEqual({ type: "PLAY", cardIndex: 0, selectedColor: undefined })
    expect(decision.sayUnoBeforePlay).toBe(true)
  })

  it("draws when no card is legal", () => {
    const decision = decideBotTurn({
      type: "TAKE_TURN",
      requestId: 2,
      playerIndex: 1,
      round: roundWithBotHand([{ type: "NUMBERED", color: "BLUE", number: 8 }]),
    })

    expect(decision.action).toEqual({ type: "DRAW" })
  })

  it("chooses the most common colored card color for a wild", () => {
    expect(chooseWildColor([
      { type: "WILD" },
      { type: "NUMBERED", color: "GREEN", number: 1 },
      { type: "SKIP", color: "GREEN" },
      { type: "NUMBERED", color: "RED", number: 2 },
    ])).toBe("GREEN")
  })
})
