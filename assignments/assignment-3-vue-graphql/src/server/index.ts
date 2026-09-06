import { ApolloServer } from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone"
import { useServer } from "graphql-ws/use/ws"
import { resolve } from "node:path"
import { WebSocketServer } from "ws"
import { JsonFilePersistence } from "./persistence"
import { createSchema, type GraphQLContext } from "./schema"
import { GameService } from "./service"

const httpPort = Number(process.env.PORT ?? 4000)
const wsPort = Number(process.env.WS_PORT ?? 4001)
const dataFile = process.env.UNO_DATA_FILE ?? resolve("data/uno.json")

const service = await GameService.create({ persistence: new JsonFilePersistence(dataFile) })
const schema = createSchema()

const wsServer = new WebSocketServer({ port: wsPort, path: "/graphql" })
useServer<GraphQLContext>({
  schema,
  context: async context => ({
    service,
    token: bearerToken((context.connectionParams?.authorization as string | undefined) ?? undefined),
  }),
}, wsServer)

const server = new ApolloServer<GraphQLContext>({ schema })
const { url } = await startStandaloneServer(server, {
  listen: { port: httpPort },
  context: async ({ req }) => ({
    service,
    token: bearerToken(req.headers.authorization),
  }),
})

console.log(`UNO GraphQL HTTP: ${url}`)
console.log(`UNO GraphQL subscriptions: ws://localhost:${wsPort}/graphql`)

function bearerToken(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const match = /^Bearer\s+(.+)$/i.exec(value.trim())
  return match?.[1]
}
