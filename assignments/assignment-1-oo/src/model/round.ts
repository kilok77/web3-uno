import {
  colors,
  createDeckFromMemento,
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

export type RoundMemento = {
  readonly players: readonly string[]
  readonly hands: readonly (readonly Card[])[]
  readonly drawPile: readonly Card[]
  readonly discardPile: readonly Card[]
  readonly currentColor: Color
  readonly currentDirection: Direction
  readonly dealer: number
  readonly playerInTurn: number
}

export type RoundEndEvent = { readonly winner: number }
export type RoundEndCallback = (event: RoundEndEvent) => void

type RestoredRoundState = Omit<
  RoundMemento,
  "players" | "dealer"
>

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
  readonly #unoVulnerablePlayers: Set<number>
  #declaredUnoPlayer: number | undefined
  #winnerIndex: number | undefined
  readonly #endCallbacks: RoundEndCallback[]

  readonly dealer: number

  constructor({
    players,
    dealer,
    shuffler = standardShuffler,
    cardsPerPlayer = 7,
  }: RoundConfig, restoredState?: RestoredRoundState) {
    this.#players = [...players]
    this.dealer = dealer
    this.#shuffler = shuffler
    this.#playableDrawnCardIndex = undefined
    this.#unoVulnerablePlayers = new Set()
    this.#declaredUnoPlayer = undefined
    this.#winnerIndex = undefined
    this.#endCallbacks = []

    if (restoredState !== undefined) {
      this.#hands = restoredState.hands.map(cards =>
        new Hand(createDeckFromMemento(cards).toMemento()),
      )
      this.#drawPile = createDeckFromMemento(restoredState.drawPile)
      this.#discardPile = createDeckFromMemento(restoredState.discardPile)
      this.#currentColor = restoredState.currentColor
      this.#currentDirection = restoredState.currentDirection
      this.#playerInTurn = restoredState.playerInTurn
      return
    }

    assertPlayerCount(players.length)
    assertStartingHandSize(cardsPerPlayer, players.length)
    assertDealer(dealer)

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

  playerInTurn(): number | undefined {
    return this.#winnerIndex === undefined ? this.#playerInTurn : undefined
  }

  currentColor(): Color {
    return this.#currentColor
  }

  currentDirection(): Direction {
    return this.#currentDirection
  }

  canPlay(cardIndex: number): boolean {
    if (this.hasEnded()) return false
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
    if (this.hasEnded()) return false
    const hand = this.#hands[this.#playerInTurn]
    return hand.cards.some((_, index) => this.canPlay(index))
  }

  play(cardIndex: number, selectedColor?: Color): Card {
    this.assertInProgress()
    const actor = this.#playerInTurn
    const hand = this.#hands[actor]
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
    const declaredUno = this.beginAction(actor)

    const played = hand.remove(cardIndex)
    if (played === undefined) throw new Error("Card index is out of bounds")

    this.#discardPile = new Deck([played, ...this.#discardPile.toMemento()])
    this.#currentColor = nextColor
    this.#playableDrawnCardIndex = undefined
    this.applyPlayedCardEffect(played)
    if (hand.size === 0) {
      this.complete(actor)
    } else if (hand.size === 1 && !declaredUno) {
      this.#unoVulnerablePlayers.add(actor)
    }
    return played
  }

  draw(): void {
    this.assertInProgress()
    if (this.#playableDrawnCardIndex !== undefined) {
      throw new Error("The playable drawn card must be played or declined")
    }

    const actor = this.#playerInTurn
    const hand = this.#hands[actor]
    const drawnCard = this.takeDrawCard()
    this.beginAction(actor)

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

  sayUno(playerIndex: number): void {
    this.assertInProgress()
    assertPlayerIndex(playerIndex, this.playerCount)

    if (this.#unoVulnerablePlayers.delete(playerIndex)) return

    if (
      playerIndex === this.#playerInTurn
      && this.#hands[playerIndex].size === 2
    ) {
      this.#declaredUnoPlayer = playerIndex
    }
  }

  catchUnoFailure({
    accused,
  }: { readonly accuser: number; readonly accused: number }): boolean {
    assertPlayerIndex(accused, this.playerCount)
    if (!this.#unoVulnerablePlayers.has(accused)) return false

    this.drawCards(this.#hands[accused], 4)
    this.#unoVulnerablePlayers.delete(accused)
    return true
  }

  hasEnded(): boolean {
    return this.#winnerIndex !== undefined
  }

  winner(): number | undefined {
    return this.#winnerIndex
  }

  score(): number | undefined {
    if (this.#winnerIndex === undefined) return undefined

    return this.#hands.reduce((total, hand, playerIndex) => {
      if (playerIndex === this.#winnerIndex) return total
      return total + hand.cards.reduce(
        (handScore, card) => handScore + scoreCard(card),
        0,
      )
    }, 0)
  }

  onEnd(callback: RoundEndCallback): void {
    this.#endCallbacks.push(callback)
  }

  private complete(winner: number): void {
    if (this.#winnerIndex !== undefined) return

    this.#winnerIndex = winner
    this.#declaredUnoPlayer = undefined
    this.#unoVulnerablePlayers.clear()
    const event: RoundEndEvent = { winner }
    for (const callback of this.#endCallbacks) callback(event)
  }

  private assertInProgress(): void {
    if (this.hasEnded()) throw new Error("The Round has ended")
  }

  private beginAction(actor: number): boolean {
    const declaredUno = this.#declaredUnoPlayer === actor
    this.#declaredUnoPlayer = undefined
    this.#unoVulnerablePlayers.clear()
    return declaredUno
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

export function createRoundFromMemento(
  memento: RoundMemento,
  shuffler: Shuffler<Card> = standardShuffler,
): Round {
  return new Round(
    {
      players: memento.players,
      dealer: memento.dealer,
      shuffler,
    },
    {
      hands: memento.hands,
      drawPile: memento.drawPile,
      discardPile: memento.discardPile,
      currentColor: memento.currentColor,
      currentDirection: memento.currentDirection,
      playerInTurn: memento.playerInTurn,
    },
  )
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

function scoreCard(card: Card): number {
  switch (card.type) {
    case "NUMBERED":
      return card.number
    case "SKIP":
    case "REVERSE":
    case "DRAW":
      return 20
    case "WILD":
    case "WILD DRAW":
      return 50
  }
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
