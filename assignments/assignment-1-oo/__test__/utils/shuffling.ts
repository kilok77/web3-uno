import { Card } from "../../src/model/deck"
import { Shuffler } from "../../src/utils/random_utils"

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
