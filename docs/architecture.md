# Semester Architecture

The semester is one evolving UNO project expressed as six independent assignment snapshots. The domain rules remain separate from user interfaces, state-management frameworks, workers, networking, persistence, and rendering frameworks.

## Evolution

```text
A1 OO
 ├──► A2 Vue + bots
 │       └──► A3 GraphQL multiplayer ──┐
 │                                      │
 └──► A4 Functional ────────────────────┤
                                        ▼
                                      A5
                                React/Redux/RxJS
                                        │
                                        ▼
                                      A6
                                     Next.js
```

- Assignment 2 extends the object-oriented model with a browser UI and bot workers.
- Assignment 3 makes the server authoritative and connects the Vue client through GraphQL.
- Assignment 4 independently expresses the Assignment 1 domain concepts as immutable data and pure functions.
- Assignment 5 combines multiplayer concerns learned in Assignment 3 with the functional model from Assignment 4.
- Assignment 6 adapts the Assignment 5 application to Next.js and explicit server/client rendering boundaries.

Creating a later assignment does not replace or delete an earlier one. Each directory under [`../assignments/`](../assignments/) remains a self-contained, runnable submission snapshot.

## Final conceptual architecture

```text
React / Next.js UI
        ↓
      Redux
        ↑
       RxJS
        ↑
GraphQL Client
        │
──────── network ────────
        │
Apollo Server
        ↓
Application layer
        ↓
Functional UNO model
        ↓
Persistence
```

The arrows show conceptual information flow, not a requirement that every action traverse every layer. UI components render state and emit intent. Redux manages client application state. RxJS primarily models asynchronous server and event streams. GraphQL carries commands, queries, and viewer-safe updates. The application layer coordinates use cases while the domain model owns UNO rules. Persistence stores serializable state rather than framework or class instances.

Earlier assignments intentionally stop at earlier architectural stages. They must not gain React, GraphQL, Next.js, or another later technology unless their own verified specification requires it.

## Shared boundary

The shared architectural seam is the serializable state contract described in [`domain-contract.md`](domain-contract.md). It lets assignment-specific domain implementations differ while retaining stable language for cards, identity, commands, events, and state transfer.
