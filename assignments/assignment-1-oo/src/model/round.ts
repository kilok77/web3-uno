import {
  colors,
  Deck,
  createInitialDeck,
  type Card,
  type Color,
} from "./deck"
import { Hand, type HandView } from "./hand"
import {
  standardShuffler,
  type Shuffler,
} from "../utils/random_utils"

export type Direction = "clockwise" | "counterclockwise"

export type RoundConfig = {
  readonly players: readonly string[]
  readonly dealer: number
  readonly shuffler?: Shuffler<Card>
  readonly cardsPerPlayer?: number
}

/** State and legality queries for one UNO round. */
export class Round {
  readonly #players: string[]
  readonly #hands: Hand[]
  #drawPile: Deck
  #discardPile: Deck
  #currentColor: Color
  #currentDirection: Direction
  #playerInTurn: number
  #playableDrawnCardIndex: number | undefined
  readonly #shuffler: Shuffler<Card>

  readonly dealer: number

  constructor({
    players,
    dealer,
    shuffler = standardShuffler,
    cardsPerPlayer = 7,
  }: RoundConfig) {
    assertPlayerCount(players.length)
    assertStartingHandSize(cardsPerPlayer, players.length)
    assertDealer(dealer)

    this.#players = [...players]
    this.dealer = dealer
    this.#shuffler = shuffler

    let deck = createInitialDeck()
    deck.shuffle(shuffler)
    this.#hands = dealHands(deck, players.length, cardsPerPlayer)

    const initialDiscard = takeInitialDiscard(deck, shuffler)
    this.#drawPile = initialDiscard.drawPile
    this.#discardPile = new Deck([initialDiscard.card])
    this.#currentColor = initialDiscard.card.color

    const initialState = resolveInitialAction(
      initialDiscard.card,
      dealer,
      players.length,
      this.#hands,
      this.#drawPile,
    )
    this.#currentDirection = initialState.direction
    this.#playerInTurn = initialState.playerInTurn
    this.#playableDrawnCardIndex = undefined
  }

  get playerCount(): number {
    return this.#players.length
  }

  player(index: number): string {
    assertPlayerIndex(index, this.playerCount)
    return this.#players[index]
  }

  playerHand(index: number): HandView {
    assertPlayerIndex(index, this.playerCount)
    return this.#hands[index].cards
  }

  drawPile(): Deck {
    return this.#drawPile
  }

  discardPile(): Deck {
    return this.#discardPile
  }

  playerInTurn(): number {
    return this.#playerInTurn
  }

  currentColor(): Color {
    return this.#currentColor
  }

  currentDirection(): Direction {
    return this.#currentDirection
  }

  canPlay(cardIndex: number): boolean {
    const hand = this.#hands[this.#playerInTurn]
    if (!isCardIndex(cardIndex, hand.size)) return false
    if (
      this.#playableDrawnCardIndex !== undefined
      && cardIndex !== this.#playableDrawnCardIndex
    ) {
      return false
    }

    const card = hand.at(cardIndex)
    const topCard = this.#discardPile.top()
    if (card === undefined || topCard === undefined) return false

    return isPlayable(card, topCard, this.#currentColor, hand.cards)
  }

  canPlayAny(): boolean {
    const hand = this.#hands[this.#playerInTurn]
    return hand.cards.some((_, index) => this.canPlay(index))
  }

  play(cardIndex: number, selectedColor?: Color): Card {
    const hand = this.#hands[this.#playerInTurn]
    const card = hand.at(cardIndex)
    if (card === undefined || !this.canPlay(cardIndex)) {
      throw new Error("The selected card cannot be played")
    }

    const isWild = card.type === "WILD" || card.type === "WILD DRAW"
    if (isWild && (selectedColor === undefined || !colors.includes(selectedColor))) {
      throw new Error("A Wild card requires a selected color")
    }
    if (!isWild && selectedColor !== undefined) {
      throw new Error("A colored card cannot select a color")
    }
    if (
      card.type !== "NUMBERED"
      && card.type !== "SKIP"
      && card.type !== "REVERSE"
      && card.type !== "DRAW"
      && card.type !== "WILD"
      && card.type !== "WILD DRAW"
    ) {
      throw new Error("This card's play effect is not implemented yet")
    }
    const nextColor = card.type === "WILD" || card.type === "WILD DRAW"
      ? selectedColor as Color
      : card.color

    const played = hand.remove(cardIndex)
    if (played === undefined) throw new Error("Card index is out of bounds")

    this.#discardPile = new Deck([played, ...this.#discardPile.toMemento()])
    this.#currentColor = nextColor
    this.#playableDrawnCardIndex = undefined
    this.applyPlayedCardEffect(played)
    return played
  }

  draw(): void {
    if (this.#playableDrawnCardIndex !== undefined) {
      throw new Error("The playable drawn card must be played or declined")
    }

    const hand = this.#hands[this.#playerInTurn]
    const drawnCard = this.takeDrawCard()

    hand.add(drawnCard)
    const drawnCardIndex = hand.size - 1
    const topCard = this.#discardPile.top()
    const drawnCardIsPlayable = topCard !== undefined
      && isPlayable(drawnCard, topCard, this.#currentColor, hand.cards)

    if (drawnCardIsPlayable) {
      this.#playableDrawnCardIndex = drawnCardIndex
      return
    }

    this.advanceTurn()
  }

  private applyPlayedCardEffect(card: Card): void {
    switch (card.type) {
      case "SKIP":
        this.advanceTurn(2)
        return

      case "REVERSE":
        this.#currentDirection = this.#currentDirection === "clockwise"
          ? "counterclockwise"
          : "clockwise"
        this.advanceTurn(this.playerCount === 2 ? 2 : 1)
        return

      case "DRAW": {
        this.applyDrawPenalty(2)
        return
      }

      case "WILD DRAW":
        this.applyDrawPenalty(4)
        return

      case "NUMBERED":
      case "WILD":
        this.advanceTurn()
        return

    }
  }

  private applyDrawPenalty(cardCount: number): void {
    const penalizedPlayer = this.nextPlayer()
    this.drawCards(this.#hands[penalizedPlayer], cardCount)
    this.advanceTurn(2)
  }

  private drawCards(hand: Hand, cardCount: number): void {
    for (let drawn = 0; drawn < cardCount; drawn += 1) {
      hand.add(this.takeDrawCard())
    }
  }

  private takeDrawCard(): Card {
    let card = this.#drawPile.deal()
    if (card === undefined) {
      this.recycleDiscardPile()
      card = this.#drawPile.deal()
    }
    if (card === undefined) {
      throw new Error("No card is available to draw")
    }

    if (this.#drawPile.size === 0) {
      this.recycleDiscardPile()
    }
    return card
  }

  private recycleDiscardPile(): void {
    const [topCard, ...recycledCards] = this.#discardPile.toMemento()
    if (topCard === undefined || recycledCards.length === 0) return

    this.#discardPile = new Deck([topCard])
    this.#drawPile = new Deck(recycledCards)
    this.#drawPile.shuffle(this.#shuffler)
  }

  private nextPlayer(): number {
    return advance(
      this.#playerInTurn,
      this.#currentDirection === "clockwise" ? 1 : -1,
      this.playerCount,
    )
  }

  private advanceTurn(distance = 1): void {
    this.#playerInTurn = advance(
      this.#playerInTurn,
      this.#currentDirection === "clockwise" ? distance : -distance,
      this.playerCount,
    )
  }
}

export function createRound(config: RoundConfig): Round {
  return new Round(config)
}

type InitialDiscard = Exclude<Card, { readonly type: "WILD" | "WILD DRAW" }>

function dealHands(
  deck: Deck,
  playerCount: number,
  cardsPerPlayer: number,
): Hand[] {
  const hands: Hand[] = []

  for (let player = 0; player < playerCount; player += 1) {
    const cards: Card[] = []
    for (let card = 0; card < cardsPerPlayer; card += 1) {
      const dealt = deck.deal()
      if (dealt === undefined) {
        throw new Error("The deck does not contain enough cards to deal the round")
      }
      cards.push(dealt)
    }
    hands.push(new Hand(cards))
  }

  return hands
}

function takeInitialDiscard(deck: Deck, shuffler: Shuffler<Card>): {
  readonly card: InitialDiscard
  readonly drawPile: Deck
} {
  let drawPile = deck

  while (true) {
    const candidate = drawPile.deal()
    if (candidate === undefined) {
      throw new Error("The deck does not contain an initial discard")
    }

    if (candidate.type !== "WILD" && candidate.type !== "WILD DRAW") {
      return { card: candidate, drawPile }
    }

    drawPile = new Deck([...drawPile.toMemento(), candidate])
    drawPile.shuffle(shuffler)
  }
}

function resolveInitialAction(
  card: InitialDiscard,
  dealer: number,
  playerCount: number,
  hands: Hand[],
  drawPile: Deck,
): { readonly direction: Direction; readonly playerInTurn: number } {
  switch (card.type) {
    case "REVERSE":
      return {
        direction: "counterclockwise",
        playerInTurn: advance(dealer, -1, playerCount),
      }

    case "SKIP":
      return {
        direction: "clockwise",
        playerInTurn: advance(dealer, 2, playerCount),
      }

    case "DRAW": {
      const penalizedPlayer = advance(dealer, 1, playerCount)
      drawCards(hands[penalizedPlayer], drawPile, 2)
      return {
        direction: "clockwise",
        playerInTurn: advance(dealer, 2, playerCount),
      }
    }

    case "NUMBERED":
      return {
        direction: "clockwise",
        playerInTurn: advance(dealer, 1, playerCount),
      }
  }
}

function drawCards(hand: Hand, drawPile: Deck, count: number): void {
  for (let draw = 0; draw < count; draw += 1) {
    const card = drawPile.deal()
    if (card === undefined) {
      throw new Error("The draw pile does not contain enough cards")
    }
    hand.add(card)
  }
}

function advance(player: number, distance: number, playerCount: number): number {
  return ((player + distance) % playerCount + playerCount) % playerCount
}

function isPlayable(
  card: Card,
  topCard: Card,
  currentColor: Color,
  hand: HandView,
): boolean {
  if (card.type === "WILD") return true

  if (card.type === "WILD DRAW") {
    return !hand.some(heldCard =>
      "color" in heldCard && heldCard.color === currentColor,
    )
  }

  if (card.color === currentColor) return true

  if (card.type === "NUMBERED" && topCard.type === "NUMBERED") {
    return card.number === topCard.number
  }

  return isActionCard(card)
    && isActionCard(topCard)
    && card.type === topCard.type
}

function isActionCard(
  card: Card,
): card is Extract<Card, { readonly type: "SKIP" | "REVERSE" | "DRAW" }> {
  return card.type === "SKIP"
    || card.type === "REVERSE"
    || card.type === "DRAW"
}

function isCardIndex(index: number, handSize: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < handSize
}

function assertPlayerCount(playerCount: number): void {
  if (playerCount < 2 || playerCount > 10) {
    throw new Error("A Round requires between 2 and 10 players")
  }
}

function assertPlayerIndex(index: number, playerCount: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= playerCount) {
    throw new Error("Player index is out of bounds")
  }
}

function assertStartingHandSize(cardsPerPlayer: number, playerCount: number): void {
  if (
    !Number.isInteger(cardsPerPlayer)
    || cardsPerPlayer < 0
    || cardsPerPlayer * playerCount >= 108
  ) {
    throw new Error("Invalid starting hand size")
  }
}

function assertDealer(dealer: number): void {
  if (!Number.isInteger(dealer)) {
    throw new Error("Dealer must be an integer")
  }
}
