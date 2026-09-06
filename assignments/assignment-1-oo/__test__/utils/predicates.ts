import { Card, Color, Type } from "../../src/model/deck"

export type CardPredicate = (card: Card | undefined) => boolean

export type CardSpec = {
  type?: Type | Type[]
  color?: Color | Color[]
  number?: number | number[]
}

export function is(spec: CardSpec): CardPredicate {
  function conforms<T>(expected: undefined | T | T[], actual: T): boolean {
    if (Array.isArray(expected)) return expected.includes(actual)
    if (expected === undefined) return true
    return expected === actual
  }

  return card => {
    if (card === undefined) return false
    switch (card.type) {
      case "NUMBERED":
        return conforms(spec.type, "NUMBERED")
          && conforms(spec.color, card.color)
          && conforms(spec.number, card.number)
      case "SKIP":
      case "REVERSE":
      case "DRAW":
        return conforms(spec.type, card.type)
          && conforms(spec.color, card.color)
          && spec.number === undefined
      default:
        return conforms(spec.type, card.type)
          && spec.color === undefined
          && spec.number === undefined
    }
  }
}
