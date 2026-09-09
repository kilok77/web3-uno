import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from "@apollo/client/core"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { getMainDefinition } from "@apollo/client/utilities"
import { createClient } from "graphql-ws"
import { readBrowserToken } from "../shared/auth"

const httpUri = process.env.NEXT_PUBLIC_GRAPHQL_HTTP ?? "http://localhost:4000/"
const wsUri = process.env.NEXT_PUBLIC_GRAPHQL_WS ?? "ws://localhost:4001/graphql"

const authLink = new ApolloLink((operation, forward) => {
  const token = readBrowserToken()
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
    },
  }))
  return forward(operation)
})

const httpLink = new HttpLink({ uri: httpUri })
const wsLink = new GraphQLWsLink(createClient({
  url: wsUri,
  connectionParams: () => {
    const token = readBrowserToken()
    return token === null ? {} : { authorization: `Bearer ${token}` }
  },
}))

const transportLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === "OperationDefinition" && definition.operation === "subscription"
  },
  wsLink,
  authLink.concat(httpLink),
)

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: transportLink,
})
