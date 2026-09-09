import type { GameSummary, PublicPlayer } from "./client/types"

export type ServerBootstrap = {
  player?: PublicPlayer
  games: GameSummary[]
}

const BOOTSTRAP_QUERY = `query SsrBootstrap { me { id username score } games { id name status hostId hostUsername maxPlayers playerCount joined } }`

export async function loadServerBootstrap(token: string | undefined): Promise<ServerBootstrap> {
  if (token === undefined || token.length === 0) return { games: [] }
  const endpoint = process.env.GRAPHQL_HTTP ?? "http://localhost:4000/"
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: BOOTSTRAP_QUERY }),
      cache: "no-store",
    })
    if (!response.ok) return { games: [] }
    const payload = await response.json() as { data?: { me?: PublicPlayer; games?: GameSummary[] }; errors?: unknown[] }
    if (payload.errors !== undefined || payload.data?.me === undefined) return { games: [] }
    return { player: payload.data.me, games: payload.data.games ?? [] }
  } catch {
    return { games: [] }
  }
}
