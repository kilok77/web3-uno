import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import type { PersistedState } from "./types"

export interface Persistence {
  load(): Promise<PersistedState>
  save(state: PersistedState): Promise<void>
}

const emptyState = (): PersistedState => ({ players: [], games: [] })

export class MemoryPersistence implements Persistence {
  #state = emptyState()

  async load(): Promise<PersistedState> {
    return structuredClone(this.#state)
  }

  async save(state: PersistedState): Promise<void> {
    this.#state = structuredClone(state)
  }
}

export class JsonFilePersistence implements Persistence {
  constructor(readonly path: string) {}

  async load(): Promise<PersistedState> {
    try {
      const text = await readFile(this.path, "utf8")
      const parsed = JSON.parse(text) as PersistedState
      if (!Array.isArray(parsed.players) || !Array.isArray(parsed.games)) {
        throw new Error("UNO persistence file has an invalid shape")
      }
      return parsed
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState()
      throw error
    }
  }

  async save(state: PersistedState): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    const temporary = `${this.path}.tmp`
    await writeFile(temporary, JSON.stringify(state, null, 2), "utf8")
    await rename(temporary, this.path)
  }
}
