# Assignment 5 — React + Redux + RxJS

Self-contained WEB3 Assignment 5 snapshot combining the Assignment 3 multiplayer boundary with the Assignment 4 functional UNO domain.

## Architecture

- **React** renders authentication, lobby, waiting room, play, and finished-game screens.
- **Redux Toolkit** owns client application/network state only.
- **RxJS** represents the live `gameUpdated` GraphQL subscription stream.
- **Apollo GraphQL** carries queries and commands to the authoritative server.
- The copied **functional A4 model** is the only owner of UNO rules on the server.
- Opponent hands are projected server-side to card counts; the browser never receives their cards.

## Run

Use Node 22:

```bash
npm install
npm run dev
```

- React client: http://localhost:5175
- GraphQL HTTP: http://localhost:4000/
- GraphQL subscriptions: ws://localhost:4001/graphql

Open two browser profiles/private windows, register different users, create/join a game, and start it from the host account.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

Assignment 4's original 185 functional tests remain a separate CI regression gate, while A5 tests cover the authoritative functional multiplayer service, Redux state transitions, and RxJS update stabilization.
