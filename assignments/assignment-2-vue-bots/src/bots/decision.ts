import { colors, type Card, type Color } from "../domain/model/deck"
import { createRoundFromMemento } from "../domain/model/round"
import type { BotTurnDecision, BotTurnRequest } from "../workers/protocol"

export function decideBotTurn(
  request: BotTurnRequest,
  random: () => number = Math.random,
): BotTurnDecision {
  if (request.round.playerInTurn !== request.playerIndex) {
    throw new Error("Bot was asked to act outside its turn")
  }

  const round = createRoundFromMemento(request.round)
  const hand = request.round.hands[request.playerIndex] ?? []
  const playableIndexes = hand
    .map((_, index) => index)
    .filter(index => round.canPlay(index))

  const catchUnoTarget = request.catchablePlayerIndex !== undefined
    && request.catchablePlayerIndex !== request.playerIndex
    && random() < 0.65
      ? request.catchablePlayerIndex
      : undefined

  if (playableIndexes.length === 0) {
    return {
      type: "TURN_DECISION",
      requestId: request.requestId,
      playerIndex: request.playerIndex,
      catchUnoTarget,
      action: { type: "DRAW" },
    }
  }

  const cardIndex = playableIndexes[0]
  const card = hand[cardIndex]
  const sayUnoBeforePlay = hand.length === 2 ? random() < 0.75 : undefined
  const selectedColor = card.type === "WILD" || card.type === "WILD DRAW"
    ? chooseWildColor(hand)
    : undefined

  return {
    type: "TURN_DECISION",
    requestId: request.requestId,
    playerIndex: request.playerIndex,
    catchUnoTarget,
    sayUnoBeforePlay,
    action: {
      type: "PLAY",
      cardIndex,
      selectedColor,
    },
  }
}

export function chooseWildColor(hand: readonly Card[]): Color {
  const counts = new Map<Color, number>(colors.map(color => [color, 0]))
  for (const card of hand) {
    if ("color" in card) counts.set(card.color, (counts.get(card.color) ?? 0) + 1)
  }

  return colors.reduce((best, candidate) =>
    (counts.get(candidate) ?? 0) > (counts.get(best) ?? 0) ? candidate : best,
  colors[0])
}
