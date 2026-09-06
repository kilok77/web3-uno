import { defineStore } from "pinia"
import { markRaw } from "vue"
import { createRound, type Round, type RoundMemento } from "../domain/model/round"
import type { Color } from "../domain/model/deck"
import { BotPool } from "../workers/botPool"
import type { BotTurnDecision, BotWorkerMessage } from "../workers/protocol"

type Screen = "setup" | "game" | "game-over"

const botPool = new BotPool()
let nextRequestId = 1

export const useGameStore = defineStore("game", {
  state: () => ({
    screen: "setup" as Screen,
    humanName: "Player",
    botCount: 1,
    round: null as Round | null,
    snapshot: null as RoundMemento | null,
    winnerIndex: null as number | null,
    catchablePlayerIndex: null as number | null,
    unoPrimedPlayerIndex: null as number | null,
    humanMustResolveDraw: false,
    botThinking: false,
    pendingBotRequestId: null as number | null,
    statusMessage: "",
  }),

  getters: {
    players: state => state.snapshot?.players ?? [],
    humanHand: state => state.snapshot?.hands[0] ?? [],
    isHumanTurn: state => state.screen === "game" && state.snapshot?.playerInTurn === 0,
    discardTop: state => state.snapshot?.discardPile[0],
  },

  actions: {
    startRound(name: string, botCount: number): void {
      botPool.stop()
      const safeBotCount = Math.min(3, Math.max(1, Math.trunc(botCount)))
      const safeName = name.trim() || "Player"
      const players = [safeName, ...Array.from({ length: safeBotCount }, (_, index) => `Bot ${index + 1}`)]
      const dealer = Math.floor(Math.random() * players.length)

      this.humanName = safeName
      this.botCount = safeBotCount
      this.round = markRaw(createRound({ players, dealer }))
      this.winnerIndex = null
      this.catchablePlayerIndex = null
      this.unoPrimedPlayerIndex = null
      this.humanMustResolveDraw = false
      this.botThinking = false
      this.pendingBotRequestId = null
      this.statusMessage = "Round started"
      this.screen = "game"
      this.syncRound()

      botPool.start(safeBotCount, message => this.handleBotMessage(message))
      this.scheduleBotTurn()
    },

    playHumanCard(cardIndex: number, selectedColor?: Color): void {
      if (this.round === null || !this.isHumanTurn) return
      const beforeSize = this.round.playerHand(0).length
      const declaredUno = this.unoPrimedPlayerIndex === 0
      this.expireCatchWindow()

      try {
        this.round.play(cardIndex, selectedColor)
        this.humanMustResolveDraw = false
        this.captureUnoExposure(0, beforeSize, declaredUno)
        this.statusMessage = "Card played"
        this.syncRound()
        this.scheduleBotTurn()
      } catch (error) {
        this.statusMessage = messageFrom(error)
      }
    },

    drawHuman(): void {
      if (this.round === null || !this.isHumanTurn || this.humanMustResolveDraw) return
      this.expireCatchWindow()
      this.unoPrimedPlayerIndex = null

      try {
        this.round.draw()
        this.syncRound()
        this.humanMustResolveDraw = this.snapshot?.playerInTurn === 0
        this.statusMessage = this.humanMustResolveDraw
          ? "The drawn card is playable; play it to continue"
          : "Card drawn"
        this.scheduleBotTurn()
      } catch (error) {
        this.statusMessage = messageFrom(error)
      }
    },

    sayUnoHuman(): void {
      if (this.round === null) return
      try {
        this.round.sayUno(0)
        if (this.catchablePlayerIndex === 0) this.catchablePlayerIndex = null
        if (this.snapshot?.playerInTurn === 0 && this.humanHand.length === 2) {
          this.unoPrimedPlayerIndex = 0
        }
        this.statusMessage = "UNO!"
      } catch (error) {
        this.statusMessage = messageFrom(error)
      }
    },

    catchUnoHuman(): void {
      if (this.round === null || !this.isHumanTurn) return
      const accused = this.catchablePlayerIndex
      if (accused === null || accused === 0) return

      try {
        const caught = this.round.catchUnoFailure({ accuser: 0, accused })
        if (caught) {
          this.catchablePlayerIndex = null
          this.statusMessage = `${this.players[accused]} draws four cards`
          this.syncRound()
        }
      } catch (error) {
        this.statusMessage = messageFrom(error)
      }
    },

    isHumanCardPlayable(cardIndex: number): boolean {
      return this.round !== null && this.isHumanTurn && this.round.canPlay(cardIndex)
    },

    reset(): void {
      botPool.stop()
      this.screen = "setup"
      this.round = null
      this.snapshot = null
      this.winnerIndex = null
      this.catchablePlayerIndex = null
      this.unoPrimedPlayerIndex = null
      this.humanMustResolveDraw = false
      this.botThinking = false
      this.pendingBotRequestId = null
      this.statusMessage = ""
    },

    handleBotMessage(message: BotWorkerMessage): void {
      if (message.requestId !== this.pendingBotRequestId) return
      this.pendingBotRequestId = null
      this.botThinking = false

      if (message.type === "BOT_ERROR") {
        this.statusMessage = `Bot error: ${message.message}`
        return
      }

      this.applyBotDecision(message)
    },

    applyBotDecision(decision: BotTurnDecision): void {
      if (this.round === null || this.snapshot?.playerInTurn !== decision.playerIndex) return
      const actor = decision.playerIndex

      if (
        decision.catchUnoTarget !== undefined
        && decision.catchUnoTarget === this.catchablePlayerIndex
        && decision.catchUnoTarget !== actor
      ) {
        const caught = this.round.catchUnoFailure({
          accuser: actor,
          accused: decision.catchUnoTarget,
        })
        if (caught) this.statusMessage = `${this.players[actor]} caught a missed UNO`
      }

      const beforeSize = this.round.playerHand(actor).length
      const declaredUno = decision.sayUnoBeforePlay === true && beforeSize === 2
      if (declaredUno) {
        this.round.sayUno(actor)
        this.unoPrimedPlayerIndex = actor
      }
      this.expireCatchWindow()

      try {
        if (decision.action.type === "PLAY") {
          this.round.play(decision.action.cardIndex, decision.action.selectedColor)
          this.captureUnoExposure(actor, beforeSize, declaredUno)
          this.statusMessage = `${this.players[actor]} played a card`
        } else {
          this.round.draw()
          this.unoPrimedPlayerIndex = null
          this.statusMessage = `${this.players[actor]} drew a card`
        }
        this.syncRound()
        this.scheduleBotTurn()
      } catch (error) {
        this.statusMessage = `Bot action failed: ${messageFrom(error)}`
      }
    },

    syncRound(): void {
      if (this.round === null) return
      this.snapshot = this.round.toMemento()
      const winner = this.round.winner()
      if (winner !== undefined) {
        this.winnerIndex = winner
        this.screen = "game-over"
        this.botThinking = false
        this.pendingBotRequestId = null
        botPool.stop()
      }
    },

    scheduleBotTurn(): void {
      if (this.round === null || this.screen !== "game" || this.botThinking) return
      const playerIndex = this.snapshot?.playerInTurn
      if (playerIndex === undefined || playerIndex === 0) return

      const requestId = nextRequestId++
      this.botThinking = true
      this.pendingBotRequestId = requestId
      botPool.request({
        type: "TAKE_TURN",
        requestId,
        playerIndex,
        round: this.round.toMemento(),
        catchablePlayerIndex: this.catchablePlayerIndex ?? undefined,
      })
    },

    captureUnoExposure(actor: number, beforeSize: number, declaredUno: boolean): void {
      if (this.round === null) return
      const afterSize = this.round.playerHand(actor).length
      this.unoPrimedPlayerIndex = null
      this.catchablePlayerIndex = !this.round.hasEnded()
        && beforeSize === 2
        && afterSize === 1
        && !declaredUno
          ? actor
          : null
    },

    expireCatchWindow(): void {
      this.catchablePlayerIndex = null
    },
  },
})

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error"
}
