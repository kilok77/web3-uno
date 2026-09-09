import { afterEach, describe, expect, it, vi } from "vitest"
import { loadServerBootstrap } from "./server-bootstrap"

afterEach(() => vi.unstubAllGlobals())

describe("Next server bootstrap", () => {
  it("does not call GraphQL without a session token", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await expect(loadServerBootstrap(undefined)).resolves.toEqual({ games: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("forwards the bearer token and returns SSR-safe lobby data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { me: { id: "p1", username: "alice", score: 7 }, games: [] } }) })
    vi.stubGlobal("fetch", fetchMock)
    const result = await loadServerBootstrap("token-1")
    expect(result.player?.username).toBe("alice")
    expect(fetchMock.mock.calls[0]?.[1]?.headers.authorization).toBe("Bearer token-1")
  })
})
