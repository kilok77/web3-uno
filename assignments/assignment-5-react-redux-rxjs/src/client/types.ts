export type Color = "BLUE" | "GREEN" | "RED" | "YELLOW"
export type GameStatus = "WAITING" | "PLAYING" | "FINISHED"

/**
 * Transport/UI types are intentionally mutable because Redux Toolkit stores
 * them in Immer drafts. Domain immutability lives separately in src/domain.
 */
export type ClientCard = {
  type: string
  color?: Color
  number?: number
}

export type PublicPlayer = {
  id: string
  username: string
  score: number
}

export type AuthPayload = {
  token: string
  player: PublicPlayer
}

export type GameSummary = {
  id: string
  name: string
  status: GameStatus
  hostId: string
  hostUsername: string
  maxPlayers: number
  playerCount: number
  joined: boolean
}

export type PlayerGameView = {
  id: string
  username: string
  cardCount: number
  cards?: ClientCard[]
}

export type GameView = {
  id: string
  name: string
  status: GameStatus
  hostId: string
  maxPlayers: number
  viewerId: string
  players: PlayerGameView[]
  currentColor?: Color
  currentDirection?: string
  discardTop?: ClientCard
  playerInTurnId?: string
  winnerId?: string
  score?: number
}
