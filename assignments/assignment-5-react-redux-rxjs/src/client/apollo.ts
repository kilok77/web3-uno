import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from "@apollo/client/core"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { getMainDefinition } from "@apollo/client/utilities"
import { createClient } from "graphql-ws"

const tokenKey = "web3-uno-token"
const httpUri = import.meta.env.VITE_GRAPHQL_HTTP ?? "http://localhost:4000/"
const wsUri = import.meta.env.VITE_GRAPHQL_WS ?? "ws://localhost:4001/graphql"

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem(tokenKey)
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
    const token = localStorage.getItem(tokenKey)
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

export { tokenKey }
