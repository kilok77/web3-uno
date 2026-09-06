import { Card } from "../../src/model/deck"
import { Round } from "../../src/model/round"
import { Shuffler, standardShuffler } from "../../src/utils/random_utils"
import { CardPredicate, CardSpec, is, not } from "./predicates"
import { HandConfig, createRound } from "./test_adapter"

function constrainedShuffler(
  ...constraints: [number, CardPredicate][]
): Shuffler<Card> {
  return (cards: Card[]) => {
    constraints.sort(([first], [second]) => first - second)
    standardShuffler(cards)
    const foundCards: Card[] = []

    for (const [, predicate] of constraints) {
      const foundIndex = cards.findIndex(predicate)
      if (foundIndex === -1) throw new Error("Unsatisfiable predicate")
      foundCards.push(cards[foundIndex])
      cards.splice(foundIndex, 1)
    }

    constraints.forEach(([index], constraintIndex) => {
      cards.splice(index, 0, foundCards[constraintIndex])
    })
  }
}

export function memoizingShuffler(
  shuffler: Shuffler<Card>,
): { readonly shuffler: Shuffler<Card>; readonly memo: Readonly<Card[]> } {
  let memo: Card[] = []

  function shuffle(cards: Card[]): void {
    shuffler(cards)
    memo = [...cards]
  }

  return {
    shuffler: shuffle,
    get memo() {
      return memo
    },
  }
}

export function successiveShufflers(
  ...shufflers: Shuffler<Card>[]
): Shuffler<Card> {
  shufflers.push(standardShuffler)
  let index = 0

  return cards => {
    shufflers[index](cards)
    if (index < shufflers.length - 1) index += 1
  }
}

export function createRoundWithShuffledCards(
  props: Partial<HandConfig>,
): [Round, Readonly<Card[]>] {
  const shuffler = props.shuffler ?? standardShuffler
  const memoized = memoizingShuffler(shuffler)
  const round = createRound({
    players: props.players ?? ["a", "b", "c", "d"],
    dealer: props.dealer ?? 1,
    shuffler: memoized.shuffler,
  })
  return [round, memoized.memo]
}

export type ShuffleBuilder = {
  discard(): ShuffleBuilder
  drawPile(): ShuffleBuilder
  hand(player: number): ShuffleBuilder
  top(): ShuffleBuilder
  repeat(count: number): ShuffleBuilder
  is(...specs: CardSpec[]): ShuffleBuilder
  isnt(...specs: CardSpec[]): ShuffleBuilder
  build(): Shuffler<Card>
}

export function shuffleBuilder(
  { players, cardsPerPlayer }: { players: number; cardsPerPlayer: number } = {
    players: 4,
    cardsPerPlayer: 7,
  },
): ShuffleBuilder {
  const constraints = new Map<number, CardPredicate>()
  const topOfDiscardPile = players * cardsPerPlayer
  let currentIndex = 0
  let repetition = 1

  function constrain(predicates: CardPredicate[]): ShuffleBuilder {
    for (let repeat = 0; repeat < repetition; repeat += 1) {
      for (const predicate of predicates) {
        constraints.set(currentIndex, predicate)
        currentIndex += 1
      }
    }
    repetition = 1
    return builder
  }

  const builder: ShuffleBuilder = {
    discard() {
      currentIndex = topOfDiscardPile
      repetition = 1
      return builder
    },
    drawPile() {
      currentIndex = topOfDiscardPile + 1
      repetition = 1
      return builder
    },
    hand(player: number) {
      currentIndex = player * cardsPerPlayer
      repetition = 1
      return builder
    },
    top() {
      currentIndex = 0
      repetition = 1
      return builder
    },
    repeat(count: number) {
      repetition = count
      return builder
    },
    is(...specs: CardSpec[]) {
      return constrain(specs.map(is))
    },
    isnt(...specs: CardSpec[]) {
      return constrain(specs.map(spec => not(is(spec))))
    },
    build() {
      return constrainedShuffler(...constraints.entries())
    },
  }

  return builder
}
