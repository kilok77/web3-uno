import { cookies } from "next/headers"
import { GameClient } from "../../client/provider"
import { tokenKey } from "../../shared/auth"
import { loadServerBootstrap } from "../../server-bootstrap"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PlayPage() {
  const cookieStore = await cookies()
  const bootstrap = await loadServerBootstrap(cookieStore.get(tokenKey)?.value)
  return <><section className="ssr-banner"><strong>Dynamic SSR</strong><span>{bootstrap.player === undefined ? "No server session found — sign in below." : `Server rendered for ${bootstrap.player.username} with ${bootstrap.games.length} lobby game${bootstrap.games.length === 1 ? "" : "s"}.`}</span></section><GameClient initialState={{ player: bootstrap.player, games: bootstrap.games }} /></>
}
