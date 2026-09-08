type Resolver<T> = (result: IteratorResult<T>) => void

type Listener<T> = {
  readonly queue: T[]
  readonly waiting: Resolver<T>[]
}

/** Minimal async event bus used as the GraphQL subscription source. */
export class EventBus<K, V> {
  readonly #listeners = new Map<K, Set<Listener<V>>>()

  publish(key: K, value: V): void {
    for (const listener of this.#listeners.get(key) ?? []) {
      const waiting = listener.waiting.shift()
      if (waiting !== undefined) waiting({ value, done: false })
      else listener.queue.push(value)
    }
  }

  subscribe(key: K): AsyncIterable<V> {
    const listener: Listener<V> = { queue: [], waiting: [] }
    const listeners = this.#listeners.get(key) ?? new Set<Listener<V>>()
    listeners.add(listener)
    this.#listeners.set(key, listeners)

    const cleanup = () => {
      listeners.delete(listener)
      if (listeners.size === 0) this.#listeners.delete(key)
      while (listener.waiting.length > 0) {
        listener.waiting.shift()?.({ value: undefined as V, done: true })
      }
    }

    return {
      [Symbol.asyncIterator](): AsyncIterator<V> {
        return {
          next: async () => {
            const queued = listener.queue.shift()
            if (queued !== undefined) return { value: queued, done: false }
            return new Promise<IteratorResult<V>>(resolve => listener.waiting.push(resolve))
          },
          return: async () => {
            cleanup()
            return { value: undefined as V, done: true }
          },
        }
      },
    }
  }
}
