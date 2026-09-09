# Assignment 6 — Next.js SSR

Self-contained WEB3 Assignment 6 snapshot converted from the verified Assignment 5 React/Redux/RxJS multiplayer application.

## Rendering decisions

- `/` and `/rules` are static **Server Component** pages.
- `/play` is an explicitly dynamic **Server Component** page. It reads the session cookie and server-fetches the authenticated player and lobby before rendering.
- The interactive UNO application is a **Client Component** boundary. Redux Toolkit, Apollo Client and RxJS never leak into Server Components.
- The copied functional domain and authoritative GraphQL server remain the only owners of UNO rules.

The production build verifies this directly: `/` and `/rules` are emitted as static routes, while `/play` is emitted as a dynamic server-rendered route.

## Run

Use Node 22:

```bash
npm install
npm run dev
```

- Next.js: http://localhost:3000
- GraphQL HTTP: http://localhost:4000/
- GraphQL subscriptions: ws://localhost:4001/graphql

## Production

```bash
npm run build
npm start
```

`npm start` launches the built Next.js server and the built GraphQL server together. CI smoke-tests both production endpoints after every A6 change.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

Current A6 suite: **11/11 tests** across the retained authoritative multiplayer service, Redux state, RxJS stream behavior, and Next server-side session bootstrap.
