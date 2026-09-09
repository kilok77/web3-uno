import { describe, expect, it } from "vitest"
import { firstValueFrom, of, toArray } from "rxjs"
import { stabilizeGameUpdates } from "./live"
import type { GameView } from "./types"

const waiting: GameView = {
  id: "g1",
  name: "UNO",
  status: "WAITING",
  hostId: "p1",
  maxPlayers: 2,
  viewerId: "p1",
  players: [{ id: "p1", username: "alice", cardCount: 0 }],
}

describe("RxJS game update stream", () => {
  it("suppresses identical consecutive server projections", async () => {
    const playing: GameView = { ...waiting, status: "PLAYING", playerInTurnId: "p1" }
    const values = await firstValueFrom(
      stabilizeGameUpdates(of(waiting, structuredClone(waiting), playing)).pipe(toArray()),
    )
    expect(values).toEqual([waiting, playing])
  })
})
