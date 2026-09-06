import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"
import { colors, type Card, type Color } from "../domain/model/deck"
import { createRound, createRoundFromMemento, type Round } from "../domain/model/round"
import { standardRandomizer, standardShuffler, type Randomizer, type Shuffler } from "../domain/utils/random_utils"
import { EventBus } from "./event-bus"
import { MemoryPersistence, type Persistence } from "./persistence"
import type {
  AuthPayload,
  GameSummary,
  GameView,
  PersistedState,
  PlayerRecord,
  PublicPlayer,
  StoredGame,
} from "./types"

type ServiceOptions = {
  readonly persistence?: Persistence
  readonly randomizer?: Randomizer
  readonly shuffler?: Shuffler<Card>
}

export class GameService {
  readonly #sessions = new Map<string, string>()
  readonly #events = new EventBus<string, number>()
  #version = 0

  private constructor(
    readonly #state: PersistedState,
    readonly #persistence: Persistence,
    readonly #randomizer: Randomizer,
    readonly #shuffler: Shuffler<Card>,
  ) {}

  static async create({
    persistence = new MemoryPersistence(),
    randomizer = standardRandomizer,
    shuffler = standardShuffler,
  }: ServiceOptions = {}): Promise<GameService> {
    return new GameService(await persistence.load(), persistence, randomizer, shuffler)
  }

  async register(username: string, password: string): Promise<AuthPayload> {
    const normalized = normalizeUsername(username)
    assertPassword(password)
    if (this.#state.players.some(player => normalizeUsername(player.username) === normalized)) {
      throw new Error("Username is already registered")
    }

    const salt = randomBytes(16).toString("hex")
    const player: PlayerRecord = {
      id: randomUUID(),
      username: username.trim(),
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
      score: 0,
    }
    this.#state.players.push(player)
    await this.persist()
    return this.createSession(player)
  }

  async login(username: string, password: string): Promise<AuthPayload> {
    const normalized = normalizeUsername(username)
    const player = this.#state.players.find(candidate => normalizeUsername(candidate.username) === normalized)
    if (player === undefined || !passwordMatches(password, player)) {
      throw new Error("Invalid username or password")
    }
    return this.createSession(player)
  }

  me(token: string | undefined): PublicPlayer {
    return publicPlayer(this.requirePlayer(token))
  }

  listGames(token: string | undefined): GameSummary[] {
    const viewer = this.requirePlayer(token)
    return this.#state.games.map(game => {
      const host = this.playerById(game.hostId)
      return {
        id: game.id,
        name: game.name,
        status: game.status,
        hostId: game.hostId,
        hostUsername: host.username,
        maxPlayers: game.maxPlayers,
        playerCount: game.playerIds.length,
        joined: game.playerIds.includes(viewer.id),
      }
    })
  }

  getGame(token: string | undefined, gameId: string): GameView {
    const viewer = this.requirePlayer(token)
    const game = this.gameById(gameId)
    this.requireMembership(game, viewer.id)
    return this.project(game, viewer.id)
  }

  async createGame(token: string | undefined, name: string, maxPlayers: number): Promise<GameView> {
    const host = this.requirePlayer(token)
    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
      throw new Error("A game must allow between 2 and 4 players")
    }
    const trimmedName = name.trim()
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      throw new Error("Game name must contain between 1 and 50 characters")
    }
    const game: StoredGame = {
      id: randomUUID(),
      name: trimmedName,
      hostId: host.id,
      maxPlayers,
      playerIds: [host.id],
      status: "WAITING",
    }
    this.#state.games.push(game)
    await this.changed(game.id)
    return this.project(game, host.id)
  }

  async joinGame(token: string | undefined, gameId: string): Promise<GameView> {
    const player = this.requirePlayer(token)
    const game = this.gameById(gameId)
    if (game.status !== "WAITING") throw new Error("Only waiting games can be joined")
    if (!game.playerIds.includes(player.id)) {
      if (game.playerIds.length >= game.maxPlayers) throw new Error("Game is full")
      game.playerIds.push(player.id)
      await this.changed(game.id)
    }
    return this.project(game, player.id)
  }

  async startGame(token: string | undefined, gameId: string): Promise<GameView> {
    const actor = this.requirePlayer(token)
    const game = this.gameById(gameId)
    if (game.hostId !== actor.id) throw new Error("Only the host can start the game")
    if (game.status !== "WAITING") throw new Error("Game has already started")
    if (game.playerIds.length < 2) throw new Error("At least two players are required")

    const round = createRound({
      players: game.playerIds,
      dealer: this.#randomizer(game.playerIds.length),
      shuffler: this.#shuffler,
    })
    game.round = round.toMemento()
    game.status = "PLAYING"
    await this.changed(game.id)
    return this.project(game, actor.id)
  }

  async playCard(
    token: string | undefined,
    gameId: string,
    cardIndex: number,
    selectedColor?: Color,
  ): Promise<GameView> {
    const actor = this.requirePlayer(token)
    const { game, round, actorIndex } = this.roundForActor(gameId, actor.id, true)
    if (!Number.isInteger(cardIndex)) throw new Error("Card index must be an integer")
    if (selectedColor !== undefined && !colors.includes(selectedColor)) throw new Error("Invalid color")
    round.play(cardIndex, selectedColor)
    await this.commitRound(game, round)
    return this.project(game, actor.id)
  }

  async drawCard(token: string | undefined, gameId: string): Promise<GameView> {
    const actor = this.requirePlayer(token)
    const { game, round } = this.roundForActor(gameId, actor.id, true)
    round.draw()
    await this.commitRound(game, round)
    return this.project(game, actor.id)
  }

  async sayUno(token: string | undefined, gameId: string): Promise<GameView> {
    const actor = this.requirePlayer(token)
    const { game, round, actorIndex } = this.roundForActor(gameId, actor.id, false)
    round.sayUno(actorIndex)
    await this.commitRound(game, round)
    return this.project(game, actor.id)
  }

  async catchUno(token: string | undefined, gameId: string, accusedPlayerId: string): Promise<GameView> {
    const actor = this.requirePlayer(token)
    const { game, round, actorIndex } = this.roundForActor(gameId, actor.id, false)
    const accusedIndex = game.playerIds.indexOf(accusedPlayerId)
    if (accusedIndex === -1) throw new Error("Accused player is not in this game")
    if (accusedIndex === actorIndex) throw new Error("A player cannot catch themselves")
    round.catchUnoFailure({ accuser: actorIndex, accused: accusedIndex })
    await this.commitRound(game, round)
    return this.project(game, actor.id)
  }

  subscribeGame(token: string | undefined, gameId: string): AsyncIterable<GameView> {
    const viewer = this.requirePlayer(token)
    const game = this.gameById(gameId)
    this.requireMembership(game, viewer.id)
    const source = this.#events.subscribe(gameId)
    const service = this

    return {
      async *[Symbol.asyncIterator]() {
        for await (const _ of source) {
          yield service.project(service.gameById(gameId), viewer.id)
        }
      },
    }
  }

  private roundForActor(gameId: string, actorId: string, requireTurn: boolean) {
    const game = this.gameById(gameId)
    this.requireMembership(game, actorId)
    if (game.status !== "PLAYING" || game.round === undefined) throw new Error("Game is not in progress")
    const round = createRoundFromMemento(game.round, this.#shuffler)
    const actorIndex = game.playerIds.indexOf(actorId)
    if (requireTurn && round.playerInTurn() !== actorIndex) throw new Error("It is not this player's turn")
    return { game, round, actorIndex }
  }

  private async commitRound(game: StoredGame, round: Round): Promise<void> {
    game.round = round.toMemento()
    if (round.hasEnded()) {
      const winnerIndex = round.winner()
      if (winnerIndex === undefined) throw new Error("Ended round has no winner")
      const score = round.score() ?? 0
      const winnerId = game.playerIds[winnerIndex]
      game.status = "FINISHED"
      game.winnerId = winnerId
      game.score = score
      this.playerById(winnerId).score += score
    }
    await this.changed(game.id)
  }

  private project(game: StoredGame, viewerId: string): GameView {
    const base = {
      id: game.id,
      name: game.name,
      status: game.status,
      hostId: game.hostId,
      maxPlayers: game.maxPlayers,
      viewerId,
      winnerId: game.winnerId,
      score: game.score,
    }

    if (game.round === undefined) {
      return {
        ...base,
        players: game.playerIds.map(id => ({
          id,
          username: this.playerById(id).username,
          cardCount: 0,
        })),
      }
    }

    const round = createRoundFromMemento(game.round, this.#shuffler)
    const playerInTurn = round.playerInTurn()
    return {
      ...base,
      players: game.playerIds.map((id, index) => {
        const cards = round.playerHand(index).map(copyCard)
        return id === viewerId
          ? { id, username: this.playerById(id).username, cardCount: cards.length, cards }
          : { id, username: this.playerById(id).username, cardCount: cards.length }
      }),
      currentColor: round.currentColor(),
      currentDirection: round.currentDirection(),
      discardTop: round.discardPile().top() === undefined ? undefined : copyCard(round.discardPile().top() as Card),
      playerInTurnId: playerInTurn === undefined ? undefined : game.playerIds[playerInTurn],
    }
  }

  private createSession(player: PlayerRecord): AuthPayload {
    const token = randomBytes(24).toString("hex")
    this.#sessions.set(token, player.id)
    return { token, player: publicPlayer(player) }
  }

  private requirePlayer(token: string | undefined): PlayerRecord {
    if (token === undefined || token.length === 0) throw new Error("Authentication required")
    const id = this.#sessions.get(token)
    if (id === undefined) throw new Error("Invalid or expired session")
    return this.playerById(id)
  }

  private gameById(id: string): StoredGame {
    const game = this.#state.games.find(candidate => candidate.id === id)
    if (game === undefined) throw new Error("Game not found")
    return game
  }

  private playerById(id: string): PlayerRecord {
    const player = this.#state.players.find(candidate => candidate.id === id)
    if (player === undefined) throw new Error("Player not found")
    return player
  }

  private requireMembership(game: StoredGame, playerId: string): void {
    if (!game.playerIds.includes(playerId)) throw new Error("Player is not a member of this game")
  }

  private async changed(gameId: string): Promise<void> {
    await this.persist()
    this.#version += 1
    this.#events.publish(gameId, this.#version)
  }

  private async persist(): Promise<void> {
    await this.#persistence.save(this.#state)
  }
}

function normalizeUsername(username: string): string {
  const normalized = username.trim().toLocaleLowerCase()
  if (normalized.length < 2 || normalized.length > 30) {
    throw new Error("Username must contain between 2 and 30 characters")
  }
  return normalized
}

function assertPassword(password: string): void {
  if (password.length < 4 || password.length > 100) throw new Error("Password must contain between 4 and 100 characters")
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex")
}

function passwordMatches(password: string, player: PlayerRecord): boolean {
  const expected = Buffer.from(player.passwordHash, "hex")
  const actual = Buffer.from(hashPassword(password, player.passwordSalt), "hex")
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function publicPlayer(player: PlayerRecord): PublicPlayer {
  return { id: player.id, username: player.username, score: player.score }
}

function copyCard(card: Card): Card {
  switch (card.type) {
    case "NUMBERED": return { type: card.type, color: card.color, number: card.number }
    case "SKIP":
    case "REVERSE":
    case "DRAW": return { type: card.type, color: card.color }
    case "WILD": return { type: "WILD" }
    case "WILD DRAW": return { type: "WILD DRAW" }
  }
}
