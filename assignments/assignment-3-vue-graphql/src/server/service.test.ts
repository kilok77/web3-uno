import { describe, expect, it } from "vitest"
import type { Card } from "../domain/model/deck"
import { MemoryPersistence } from "./persistence"
import { GameService } from "./service"
import type { PlayerGameView } from "./types"

const noShuffle = (_cards: Card[]) => {}
const firstDealer = () => 0

async function fixture() {
  const persistence = new MemoryPersistence()
  const service = await GameService.create({ persistence, randomizer: firstDealer, shuffler: noShuffle })
  const alice = await service.register("alice", "secret")
  const bob = await service.register("bob", "secret")
  return { service, persistence, alice, bob }
}

describe("authoritative multiplayer service", () => {
  it("creates, joins and starts a two-player game", async () => {
    const { service, alice, bob } = await fixture()
    const created = await service.createGame(alice.token, "Friday UNO", 4)
    expect(created.status).toBe("WAITING")

    await service.joinGame(bob.token, created.id)
    const started = await service.startGame(alice.token, created.id)
    expect(started.status).toBe("PLAYING")
    expect(started.players).toHaveLength(2)
    expect(started.playerInTurnId).toBeDefined()
  })

  it("never exposes an opponent hand in a viewer projection", async () => {
    const { service, alice, bob } = await fixture()
    const created = await service.createGame(alice.token, "Private hands", 2)
    await service.joinGame(bob.token, created.id)
    await service.startGame(alice.token, created.id)

    const aliceView = service.getGame(alice.token, created.id)
    const own = aliceView.players.find(player => player.id === alice.player.id)
    const opponent = aliceView.players.find(player => player.id === bob.player.id)
    expect(own?.cards?.length).toBe(7)
    expect(opponent?.cards).toBeUndefined()
    expect(opponent?.cardCount).toBe(7)
  })

  it("enforces the server-side player in turn", async () => {
    const { service, alice, bob } = await fixture()
    const created = await service.createGame(alice.token, "Turns", 2)
    await service.joinGame(bob.token, created.id)
    const view = await service.startGame(alice.token, created.id)

    const current = view.playerInTurnId === alice.player.id ? alice : bob
    const other = current === alice ? bob : alice
    await expect(service.drawCard(other.token, created.id)).rejects.toThrow("not this player's turn")
    await expect(service.drawCard(current.token, created.id)).resolves.toBeDefined()
  })

  it("persists registered users and game state", async () => {
    const { service, persistence, alice, bob } = await fixture()
    const game = await service.createGame(alice.token, "Persist me", 2)
    await service.joinGame(bob.token, game.id)

    const restored = await GameService.create({ persistence, randomizer: firstDealer, shuffler: noShuffle })
    const aliceAgain = await restored.login("alice", "secret")
    const games = restored.listGames(aliceAgain.token)
    expect(games.some(candidate => candidate.id === game.id && candidate.joined)).toBe(true)
  })

  it("publishes viewer-safe subscription updates", async () => {
    const { service, alice, bob } = await fixture()
    const game = await service.createGame(alice.token, "Updates", 2)
    await service.joinGame(bob.token, game.id)
    const iterator = service.subscribeGame(alice.token, game.id)[Symbol.asyncIterator]()

    await service.startGame(alice.token, game.id)
    const update = await iterator.next()
    expect(update.done).toBe(false)
    if (update.done) throw new Error("Expected a game update")
    const opponent = update.value.players.find((player: PlayerGameView) => player.id === bob.player.id)
    expect(opponent?.cards).toBeUndefined()
    await iterator.return?.()
  })
})
