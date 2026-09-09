import { makeExecutableSchema } from "@graphql-tools/schema"
import type { GraphQLSchema } from "graphql"
import type { Color } from "../domain/model/deck"
import type { GameService } from "./service"

export type GraphQLContext = {
  readonly service: GameService
  readonly token?: string
}

const typeDefs = `#graphql
  enum Color { BLUE GREEN RED YELLOW }
  enum GameStatus { WAITING PLAYING FINISHED }

  type Card {
    type: String!
    color: Color
    number: Int
  }

  type Player {
    id: ID!
    username: String!
    score: Int!
  }

  type AuthPayload {
    token: String!
    player: Player!
  }

  type GameSummary {
    id: ID!
    name: String!
    status: GameStatus!
    hostId: ID!
    hostUsername: String!
    maxPlayers: Int!
    playerCount: Int!
    joined: Boolean!
  }

  type GamePlayerView {
    id: ID!
    username: String!
    cardCount: Int!
    cards: [Card!]
  }

  type GameView {
    id: ID!
    name: String!
    status: GameStatus!
    hostId: ID!
    maxPlayers: Int!
    viewerId: ID!
    players: [GamePlayerView!]!
    currentColor: Color
    currentDirection: String
    discardTop: Card
    playerInTurnId: ID
    winnerId: ID
    score: Int
  }

  type Query {
    me: Player!
    games: [GameSummary!]!
    game(id: ID!): GameView!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    createGame(name: String!, maxPlayers: Int!): GameView!
    joinGame(gameId: ID!): GameView!
    startGame(gameId: ID!): GameView!
    playCard(gameId: ID!, cardIndex: Int!, color: Color): GameView!
    drawCard(gameId: ID!): GameView!
    sayUno(gameId: ID!): GameView!
    catchUno(gameId: ID!, accusedPlayerId: ID!): GameView!
  }

  type Subscription {
    gameUpdated(gameId: ID!): GameView!
  }
`

const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, context: GraphQLContext) => context.service.me(context.token),
    games: (_: unknown, __: unknown, context: GraphQLContext) => context.service.listGames(context.token),
    game: (_: unknown, { id }: { id: string }, context: GraphQLContext) => context.service.getGame(context.token, id),
  },
  Mutation: {
    register: (_: unknown, args: { username: string; password: string }, context: GraphQLContext) =>
      context.service.register(args.username, args.password),
    login: (_: unknown, args: { username: string; password: string }, context: GraphQLContext) =>
      context.service.login(args.username, args.password),
    createGame: (_: unknown, args: { name: string; maxPlayers: number }, context: GraphQLContext) =>
      context.service.createGame(context.token, args.name, args.maxPlayers),
    joinGame: (_: unknown, { gameId }: { gameId: string }, context: GraphQLContext) =>
      context.service.joinGame(context.token, gameId),
    startGame: (_: unknown, { gameId }: { gameId: string }, context: GraphQLContext) =>
      context.service.startGame(context.token, gameId),
    playCard: (_: unknown, args: { gameId: string; cardIndex: number; color?: Color }, context: GraphQLContext) =>
      context.service.playCard(context.token, args.gameId, args.cardIndex, args.color),
    drawCard: (_: unknown, { gameId }: { gameId: string }, context: GraphQLContext) =>
      context.service.drawCard(context.token, gameId),
    sayUno: (_: unknown, { gameId }: { gameId: string }, context: GraphQLContext) =>
      context.service.sayUno(context.token, gameId),
    catchUno: (_: unknown, args: { gameId: string; accusedPlayerId: string }, context: GraphQLContext) =>
      context.service.catchUno(context.token, args.gameId, args.accusedPlayerId),
  },
  Subscription: {
    gameUpdated: {
      subscribe: (_: unknown, { gameId }: { gameId: string }, context: GraphQLContext) =>
        context.service.subscribeGame(context.token, gameId),
      resolve: (payload: unknown) => payload,
    },
  },
}

export function createSchema(): GraphQLSchema {
  return makeExecutableSchema({ typeDefs, resolvers })
}
