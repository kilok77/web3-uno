export type Color = "BLUE" | "GREEN" | "RED" | "YELLOW"
export type GameStatus = "WAITING" | "PLAYING" | "FINISHED"

export type ClientCard = {
  readonly type: string
  readonly color?: Color
  readonly number?: number
}

export type PublicPlayer = {
  readonly id: string
  readonly username: string
  readonly score: number
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
  readonly cards?: readonly ClientCard[]
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
  readonly currentDirection?: string
  readonly discardTop?: ClientCard
  readonly playerInTurnId?: string
  readonly winnerId?: string
  readonly score?: number
}
