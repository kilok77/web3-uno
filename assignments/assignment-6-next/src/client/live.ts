import { Observable, distinctUntilChanged, filter, map, shareReplay } from "rxjs"
import { apolloClient } from "./apollo"
import { GAME_UPDATED } from "./graphql"
import type { GameView } from "./types"

type SubscriptionEnvelope = {
  readonly data?: {
    readonly gameUpdated?: GameView
  }
}

export function stabilizeGameUpdates(source: Observable<GameView>): Observable<GameView> {
  return source.pipe(
    distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
  )
}

export function gameUpdates$(gameId: string): Observable<GameView> {
  const source = new Observable<SubscriptionEnvelope>(subscriber => {
    const subscription = apolloClient.subscribe<{ gameUpdated: GameView }>({
      query: GAME_UPDATED,
      variables: { gameId },
      fetchPolicy: "no-cache",
    }).subscribe({
      next: result => subscriber.next(result as SubscriptionEnvelope),
      error: error => subscriber.error(error),
      complete: () => subscriber.complete(),
    })
    return () => subscription.unsubscribe()
  })

  const projected = source.pipe(
    map(result => result.data?.gameUpdated),
    filter((game): game is GameView => game !== undefined),
  )

  return stabilizeGameUpdates(projected).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  )
}
