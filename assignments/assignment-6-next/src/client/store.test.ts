import { describe, expect, it } from "vitest"
import { gameUpdated, leaveGameView, store } from "./store"
import type { GameView } from "./types"

const game: GameView = {
  id: "g1",
  name: "Test",
  status: "WAITING",
  hostId: "p1",
  maxPlayers: 2,
  viewerId: "p1",
  players: [{ id: "p1", username: "alice", cardCount: 0 }],
}

describe("Redux application state", () => {
  it("ignores live updates when no matching game is open", () => {
    store.dispatch(gameUpdated(game))
    expect(store.getState().currentGame).toBeUndefined()
  })

  it("can leave the current game view without changing server state", () => {
    store.dispatch(leaveGameView())
    expect(store.getState().currentGame).toBeUndefined()
  })
})
