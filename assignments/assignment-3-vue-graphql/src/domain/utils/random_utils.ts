// A function that returns a (possibly) random number from 0 to bound - 1.
export type Randomizer = (bound: number) => number

export const standardRandomizer: Randomizer = bound =>
  Math.floor(Math.random() * bound)

// A function that shuffles the given array in place.
export type Shuffler<T> = (cards: T[]) => void

export function standardShuffler<T>(cards: T[]): void {
  for (let index = 0; index < cards.length - 1; index += 1) {
    const randomIndex = Math.floor(
      Math.random() * (cards.length - index) + index,
    )
    const card = cards[randomIndex]
    cards[randomIndex] = cards[index]
    cards[index] = card
  }
}
