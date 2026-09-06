# Assignment 3

## Goal

Evolve the Vue browser game into authoritative GraphQL multiplayer for 2–4 human players.

## Verified requirements

### Must have

- Retain the relevant Assignment 2 UNO experience.
- Play against 1–3 human opponents.
- Give players identities.
- Allow players to create and join games.
- Notify connected players whenever game state changes.
- Use GraphQL with Apollo Server and a Vue client.

### Should have

- Persist players and scores.
- Registration and login.

### Could have

- Full multi-round scored Game orchestration and save/resume across rounds.

## Implementation

- `assignments/assignment-3-vue-graphql` is independently runnable and does not import sibling assignment folders.
- The completed Assignment 1 OO source is deliberately copied under `src/domain`.
- Apollo Server owns authoritative game sessions; GraphQL resolvers coordinate use cases and never implement UNO legality.
- `graphql-ws` provides a `gameUpdated` subscription. A server event bus publishes after lobby or round mutations.
- GraphQL projections are viewer-specific: the viewer receives their cards; opponents expose only `cardCount`.
- Registration/login use salted `scrypt` password hashes and random session tokens.
- A JSON file persistence adapter stores registered players, cumulative scores, lobbies, and serialized Round mementos. Tests use an in-memory adapter.
- The Vue 3 + Pinia client uses Apollo Client over HTTP and WebSockets.
- A3 deliberately implements one scored round per created game. Full multi-round Game orchestration remains a Could-have requirement and is left for later unless explicitly requested.
- Node 22 is the supported runtime for this snapshot and is recorded in `.nvmrc` and `package.json`.

## Local endpoints

- Vue/Vite: `http://localhost:5174`
- GraphQL HTTP: `http://localhost:4000/`
- GraphQL subscriptions: `ws://localhost:4001/graphql`

## Verification

- TypeScript/Vue typecheck: passed.
- Authoritative multiplayer service tests: 5/5 passed.
- Production Vue client and Node server build: passed.
- Repository CI: Assignments 1, 2, and 3 all green together.
- Tests specifically verify create/join/start, server-side turn enforcement, persistence, subscription updates, and that opponent hands are never exposed in viewer projections.

## Status

Assignment 3 implementation complete. The optional full multi-round scored Game remains deferred because it is a Could-have requirement.
