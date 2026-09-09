"use client"

import { useRef } from "react"
import { Provider } from "react-redux"
import { App } from "./App"
import { makeStore, type AppState, type AppStore } from "./store"

export function GameClient({ initialState }: { initialState?: Partial<AppState> }) {
  const storeRef = useRef<AppStore | null>(null)
  if (storeRef.current === null) storeRef.current = makeStore(initialState)
  return <Provider store={storeRef.current}><App /></Provider>
}
