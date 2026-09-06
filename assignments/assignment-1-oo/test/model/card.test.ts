import { describe, expect, it } from "@jest/globals"

import {
  colors,
  hasColor,
  hasNumber,
  type Card,
} from "../../src/model/deck"

describe("card foundations", () => {
  it("exports the four test-facing colors", () => {
    expect(colors).toEqual(["BLUE", "GREEN", "RED", "YELLOW"])
  })

  it("recognizes the requested color on numbered and action cards", () => {
    const numbered: Card = { type: "NUMBERED", color: "BLUE", number: 7 }
    const skip: Card = { type: "SKIP", color: "RED" }

    expect(hasColor(numbered, "BLUE")).toBe(true)
    expect(hasColor(numbered, "RED")).toBe(false)
    expect(hasColor(skip, "RED")).toBe(true)
  })

  it("does not treat wild cards as colored cards", () => {
    const wild: Card = { type: "WILD" }
    const wildDraw: Card = { type: "WILD DRAW" }

    expect(hasColor(wild, "YELLOW")).toBe(false)
    expect(hasColor(wildDraw, "GREEN")).toBe(false)
  })

  it("recognizes only the requested number on numbered cards", () => {
    const numbered: Card = { type: "NUMBERED", color: "GREEN", number: 3 }

    expect(hasNumber(numbered, 3)).toBe(true)
    expect(hasNumber(numbered, 4)).toBe(false)
  })

  it("does not treat action or wild cards as numbered cards", () => {
    const draw: Card = { type: "DRAW", color: "YELLOW" }
    const wild: Card = { type: "WILD" }

    expect(hasNumber(draw, 2)).toBe(false)
    expect(hasNumber(wild, 2)).toBe(false)
  })
})
