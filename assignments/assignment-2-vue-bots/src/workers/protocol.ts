import type { Color } from "../domain/model/deck"
import type { RoundMemento } from "../domain/model/round"

export type BotTurnRequest = {
  readonly type: "TAKE_TURN"
  readonly requestId: number
  readonly playerIndex: number
  readonly round: RoundMemento
  readonly catchablePlayerIndex?: number
}

export type BotAction =
  | { readonly type: "PLAY"; readonly cardIndex: number; readonly selectedColor?: Color }
  | { readonly type: "DRAW" }

export type BotTurnDecision = {
  readonly type: "TURN_DECISION"
  readonly requestId: number
  readonly playerIndex: number
  readonly catchUnoTarget?: number
  readonly sayUnoBeforePlay?: boolean
  readonly action: BotAction
}

export type BotWorkerError = {
  readonly type: "BOT_ERROR"
  readonly requestId: number
  readonly playerIndex: number
  readonly message: string
}

export type BotWorkerMessage = BotTurnDecision | BotWorkerError
