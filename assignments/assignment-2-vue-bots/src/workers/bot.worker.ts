import { decideBotTurn } from "../bots/decision"
import type { BotTurnRequest, BotWorkerMessage } from "./protocol"

self.onmessage = (event: MessageEvent<BotTurnRequest>) => {
  const request = event.data
  if (request.type !== "TAKE_TURN") return

  let response: BotWorkerMessage
  try {
    response = decideBotTurn(request)
  } catch (error) {
    response = {
      type: "BOT_ERROR",
      requestId: request.requestId,
      playerIndex: request.playerIndex,
      message: error instanceof Error ? error.message : "Unknown bot error",
    }
  }
  self.postMessage(response)
}
