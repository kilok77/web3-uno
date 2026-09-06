import type { BotTurnRequest, BotWorkerMessage } from "./protocol"

export class BotPool {
  readonly #workers = new Map<number, Worker>()
  #handler: ((message: BotWorkerMessage) => void) | undefined

  start(botCount: number, handler: (message: BotWorkerMessage) => void): void {
    this.stop()
    this.#handler = handler

    for (let playerIndex = 1; playerIndex <= botCount; playerIndex += 1) {
      const worker = new Worker(new URL("./bot.worker.ts", import.meta.url), { type: "module" })
      worker.onmessage = (event: MessageEvent<BotWorkerMessage>) => this.#handler?.(event.data)
      this.#workers.set(playerIndex, worker)
    }
  }

  request(request: BotTurnRequest): void {
    const worker = this.#workers.get(request.playerIndex)
    if (worker === undefined) throw new Error("No worker exists for this bot")
    worker.postMessage(request)
  }

  stop(): void {
    for (const worker of this.#workers.values()) worker.terminate()
    this.#workers.clear()
    this.#handler = undefined
  }
}
