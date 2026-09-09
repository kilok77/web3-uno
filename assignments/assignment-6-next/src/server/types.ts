import type { Card, Color } from "../domain/model/deck"
import type { Direction, RoundMemento } from "../domain/model/round"

export type PlayerRecord = {
  readonly id: string
  readonly username: string
  readonly passwordSalt: string
  readonly passwordHash: string
  score: number
}

export type PublicPlayer = {
  readonly id: string
  readonly username: string
  readonly score: number
}

export type GameStatus = "WAITING" | "PLAYING" | "FINISHED"

export type StoredGame = {
  readonly id: string
  readonly name: string
  readonly hostId: string
  readonly maxPlayers: number
  readonly playerIds: string[]
  status: GameStatus
  round?: RoundMemento
  winnerId?: string
  score?: number
}

export type PersistedState = {
  readonly players: PlayerRecord[]
  readonly games: StoredGame[]
}

export type AuthPayload = {
  readonly token: string
  readonly player: PublicPlayer
}

export type GameSummary = {
  readonly id: string
  readonly name: string
  readonly status: GameStatus
  readonly hostId: string
  readonly hostUsername: string
  readonly maxPlayers: number
  readonly playerCount: number
  readonly joined: boolean
}

export type PlayerGameView = {
  readonly id: string
  readonly username: string
  readonly cardCount: number
  readonly cards?: readonly Card[]
}

export type GameView = {
  readonly id: string
  readonly name: string
  readonly status: GameStatus
  readonly hostId: string
  readonly maxPlayers: number
  readonly viewerId: string
  readonly players: readonly PlayerGameView[]
  readonly currentColor?: Color
  readonly currentDirection?: Direction
  readonly discardTop?: Card
  readonly playerInTurnId?: string
  readonly winnerId?: string
  readonly score?: number
}
