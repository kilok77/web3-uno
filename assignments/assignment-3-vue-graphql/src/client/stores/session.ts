import { defineStore } from "pinia"
import type { Card, Color } from "../../domain/model/deck"
import { apolloClient, tokenKey } from "../apollo"
import {
  CATCH_UNO,
  CREATE_GAME,
  DRAW_CARD,
  GAME_UPDATED,
  GAMES,
  GET_GAME,
  JOIN_GAME,
  LOGIN,
  ME,
  PLAY_CARD,
  REGISTER,
  SAY_UNO,
  START_GAME,
} from "../graphql"

type Player = { id: string; username: string; score: number }
type GameSummary = { id: string; name: string; status: string; hostId: string; hostUsername: string; maxPlayers: number; playerCount: number; joined: boolean }
type GamePlayer = { id: string; username: string; cardCount: number; cards?: Card[] | null }
export type GameView = {
  id: string
  name: string
  status: "WAITING" | "PLAYING" | "FINISHED"
  hostId: string
  maxPlayers: number
  viewerId: string
  players: GamePlayer[]
  currentColor?: Color | null
  currentDirection?: string | null
  discardTop?: Card | null
  playerInTurnId?: string | null
  winnerId?: string | null
  score?: number | null
}

type SubscriptionHandle = { unsubscribe(): void }

export const useSessionStore = defineStore("session", {
  state: () => ({
    token: localStorage.getItem(tokenKey) as string | null,
    player: null as Player | null,
    games: [] as GameSummary[],
    game: null as GameView | null,
    error: "",
    busy: false,
    subscription: undefined as SubscriptionHandle | undefined,
  }),
  getters: {
    authenticated: state => state.token !== null && state.player !== null,
    ownHand(state): Card[] {
      return state.game?.players.find(player => player.id === state.game?.viewerId)?.cards ?? []
    },
  },
  actions: {
    async restore() {
      if (this.token === null) return
      try {
        const result = await apolloClient.query<{ me: Player }>({ query: ME, fetchPolicy: "network-only" })
        if (result.data === undefined) throw new Error("Unable to restore session")
        this.player = result.data.me
        await this.loadGames()
      } catch {
        this.logout()
      }
    },
    async register(username: string, password: string) {
      await this.auth(REGISTER, username, password)
    },
    async login(username: string, password: string) {
      await this.auth(LOGIN, username, password)
    },
    async auth(mutation: unknown, username: string, password: string) {
      await this.run(async () => {
        const result = await apolloClient.mutate<{ register?: { token: string; player: Player }; login?: { token: string; player: Player } }>({
          mutation: mutation as never,
          variables: { username, password },
        })
        const payload = result.data?.register ?? result.data?.login
        if (payload === undefined) throw new Error("Authentication failed")
        this.token = payload.token
        this.player = payload.player
        localStorage.setItem(tokenKey, payload.token)
        await this.loadGames()
      })
    },
    logout() {
      this.subscription?.unsubscribe()
      this.subscription = undefined
      this.token = null
      this.player = null
      this.game = null
      this.games = []
      localStorage.removeItem(tokenKey)
      void apolloClient.clearStore()
    },
    async loadGames() {
      const result = await apolloClient.query<{ games: GameSummary[] }>({ query: GAMES, fetchPolicy: "network-only" })
      if (result.data === undefined) throw new Error("Unable to load games")
      this.games = result.data.games
    },
    async createGame(name: string, maxPlayers: number) {
      await this.mutateGame(CREATE_GAME, { name, maxPlayers })
    },
    async joinGame(gameId: string) {
      await this.mutateGame(JOIN_GAME, { gameId })
    },
    async openGame(gameId: string) {
      await this.run(async () => {
        const result = await apolloClient.query<{ game: GameView }>({ query: GET_GAME, variables: { id: gameId }, fetchPolicy: "network-only" })
        if (result.data === undefined) throw new Error("Unable to load game")
        this.setGame(result.data.game)
      })
    },
    async startGame() {
      if (this.game !== null) await this.mutateGame(START_GAME, { gameId: this.game.id })
    },
    async playCard(cardIndex: number, color?: Color) {
      if (this.game !== null) await this.mutateGame(PLAY_CARD, { gameId: this.game.id, cardIndex, color })
    },
    async drawCard() {
      if (this.game !== null) await this.mutateGame(DRAW_CARD, { gameId: this.game.id })
    },
    async sayUno() {
      if (this.game !== null) await this.mutateGame(SAY_UNO, { gameId: this.game.id })
    },
    async catchUno(accusedPlayerId: string) {
      if (this.game !== null) await this.mutateGame(CATCH_UNO, { gameId: this.game.id, accusedPlayerId })
    },
    async backToLobby() {
      this.subscription?.unsubscribe()
      this.subscription = undefined
      this.game = null
      await this.loadGames()
    },
    async mutateGame(mutation: unknown, variables: Record<string, unknown>) {
      await this.run(async () => {
        const result = await apolloClient.mutate<Record<string, GameView>>({ mutation: mutation as never, variables })
        const game = result.data === undefined || result.data === null ? undefined : Object.values(result.data)[0]
        if (game === undefined) throw new Error("Game update failed")
        this.setGame(game)
      })
    },
    setGame(game: GameView) {
      const changedGame = this.game?.id !== game.id
      this.game = game
      if (changedGame || this.subscription === undefined) this.subscribe(game.id)
    },
    subscribe(gameId: string) {
      this.subscription?.unsubscribe()
      this.subscription = apolloClient.subscribe<{ gameUpdated: GameView }>({ query: GAME_UPDATED, variables: { gameId } }).subscribe({
        next: result => {
          if (result.data?.gameUpdated !== undefined) this.game = result.data.gameUpdated
        },
        error: error => { this.error = error.message },
      })
    },
    async run(action: () => Promise<void>) {
      this.busy = true
      this.error = ""
      try {
        await action()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.busy = false
      }
    },
  },
})
