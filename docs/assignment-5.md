# Assignment 5

## Goal

Build a React client using Redux and RxJS, combining the Assignment 3 multiplayer/event boundary with the Assignment 4 functional UNO model.

## Technologies

React, Redux Toolkit, RxJS, Apollo GraphQL, TypeScript, and the functional UNO model.

## Inputs from previous work

- Assignment 3: authoritative GraphQL multiplayer, authentication, lobby/create/join/start flow, viewer-safe projections, persistence, and subscriptions.
- Assignment 4: immutable functional Deck/Round/Game concepts and pure UNO state transitions.

The Assignment 5 snapshot deliberately copies/ports the required code so it remains independently runnable and does not import sibling assignment folders.

## Verified implementation contract

- Keep UNO rules in the functional domain model, not React, Redux, RxJS, or GraphQL resolvers.
- Use React for the client UI.
- Use Redux for client application/network state.
- Use RxJS for server/event messages.
- Retain the multiplayer create/join/play flow and server-authoritative command validation from Assignment 3.
- Preserve viewer-specific projections so opponents' actual cards never reach the client.

There is no separate Assignment 5 test archive under `reference/tests`; the repository therefore keeps Assignment 3 behavior and Assignment 4's supplied 185-test functional suite as regression gates, plus A5-specific integration tests.

## Implementation

### Functional authoritative server

`assignments/assignment-5-react-redux-rxjs/src/domain` is a copied snapshot of the verified Assignment 4 functional model.

The GraphQL service owns the live `Round` value and replaces it with the result of pure transitions such as `play`, `draw`, `sayUno`, and `catchUnoFailure`. The persisted public Round memento remains the stable serialization boundary.

A small in-memory live-round map preserves transient functional state that is intentionally absent from the exact A4 memento shape, including the playable-drawn-card restriction and UNO catch window, across normal GraphQL requests. A process restart restores the public memento but cannot restore those intentionally non-memento transient windows.

### React + Redux

React renders authentication, lobby, waiting room, active play, and finished-round views. Components submit commands and render server projections; they do not decide UNO legality.

Redux Toolkit owns only client concerns:

- authenticated player
- lobby summaries
- currently viewed game projection
- request busy/error state

GraphQL transport DTOs are mutable values inside Redux/Immer; the copied UNO domain remains immutable separately.

### RxJS

The Apollo `gameUpdated` subscription is wrapped as an RxJS Observable. The stream projects valid game updates, suppresses identical consecutive projections, and shares the latest update while subscribed. React subscribes to this stream and dispatches each update into Redux.

### Privacy boundary

The authoritative service projects a full hand only for the current viewer. Other players are represented by card counts only.

## Verification

Node 22 CI runs:

```bash
npm install --no-audit --no-fund
npm run typecheck
npm test
npm run build
```

Verified A5 result:

- TypeScript typecheck: passed
- A5 Vitest files: **3/3 passed**
- A5 tests: **9/9 passed**
- React/Vite production build: passed
- Node server `tsup` production build: passed
- A1, A2, A3, and A4 regression jobs: passed in the same workflow run
- A4 supplied functional suite remains **185/185** green

## Status

Complete. Assignment 6 is the next target: move the A5 React application to Next.js SSR while preserving the functional model, Redux/RxJS responsibilities, and authoritative multiplayer boundary.
