# Assignment 6

## Goal

Adapt the verified Assignment 5 React application to Next.js with deliberate server/client component and rendering decisions while retaining all multiplayer behavior.

## Implementation

Assignment 6 is implemented as the independent snapshot `assignments/assignment-6-next`.

- Next.js 16.3.4 App Router replaces the Vite-only React shell.
- `/` and `/rules` are static Server Components.
- `/play` is forced dynamic and server-rendered per request.
- `/play` reads the session cookie and fetches the authenticated player plus lobby from GraphQL on the server, then hydrates Redux with that viewer-safe state.
- `GameClient` is the explicit Client Component boundary containing Redux Toolkit, Apollo Client and RxJS.
- Live `gameUpdated` GraphQL subscriptions still flow through RxJS into Redux.
- Authentication, persistence, lobby, create/join/start, play/draw/UNO/catch, scoring, and viewer-safe opponent projections are retained from A5.
- The functional A4 domain and authoritative GraphQL server are copied into A6; Next routes/components contain no UNO rules.
- Development runs Next and GraphQL together; production build/start does the same with built artifacts.

## Rendering proof

The verified Next production build emits:

```text
○ /       static
ƒ /play   dynamic server-rendered
○ /rules  static
```

This makes the static/dynamic decision observable rather than merely documented.

## Verification

- `npm run typecheck` — green
- `npm test` — 11/11 A6 tests green
- `npm run build` — Next production build and GraphQL server build green
- `npm start` — production Next and GraphQL endpoints smoke-tested in CI
- A1–A5 remain independent regression gates in the same workflow

## Status

Complete. This finishes the six-assignment WEB3 UNO sequence.
