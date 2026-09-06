import {
  hasColor,
  hasNumber,
  type Card,
  type Color,
  type ColoredCard,
  type NumberedCard,
  type Type,
  type TypedCard,
  type WildCard,
} from "../../src/model/deck"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false

type Expect<Value extends true> = Value

type ContractChecks = [
  Expect<Equal<Color, "BLUE" | "GREEN" | "RED" | "YELLOW">>,
  Expect<
    Equal<
      Type,
      "NUMBERED" | "SKIP" | "REVERSE" | "DRAW" | "WILD" | "WILD DRAW"
    >
  >,
  Expect<Equal<TypedCard<"NUMBERED">, NumberedCard>>,
  Expect<Equal<TypedCard<"WILD">, { readonly type: "WILD" }>>,
]

const contractChecksAreCompileTimeOnly: ContractChecks | undefined = undefined
void contractChecksAreCompileTimeOnly

const numbered: NumberedCard = { type: "NUMBERED", color: "RED", number: 9 }
const skip: ColoredCard = { type: "SKIP", color: "BLUE" }
const wild: WildCard = { type: "WILD DRAW" }
const typedSkip: TypedCard<"SKIP"> = { type: "SKIP", color: "YELLOW" }

void [numbered, skip, wild, typedSkip]

function verifyNarrowing(card: Card): void {
  if (hasColor(card, "GREEN")) {
    const selectedColor: "GREEN" = card.color
    void selectedColor
  }

  if (hasNumber(card, 7)) {
    const selectedNumber: 7 = card.number
    void selectedNumber
  }
}

void verifyNarrowing

// @ts-expect-error Numbered cards require a number.
const missingNumber: Card = { type: "NUMBERED", color: "RED" }

// @ts-expect-error UNO numbered cards are restricted to 0-9.
const invalidNumber: Card = { type: "NUMBERED", color: "RED", number: 10 }

// @ts-expect-error Wild cards have no intrinsic color.
const coloredWild: Card = { type: "WILD", color: "RED" }

// @ts-expect-error Action cards have no number.
const numberedSkip: Card = { type: "SKIP", color: "BLUE", number: 2 }

// @ts-expect-error TypedCard selects only the requested discriminant.
const reverseAsSkip: TypedCard<"SKIP"> = { type: "REVERSE", color: "YELLOW" }

void [missingNumber, invalidNumber, coloredWild, numberedSkip, reverseAsSkip]
