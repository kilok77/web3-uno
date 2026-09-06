# Assignment 3 — Vue + GraphQL multiplayer

Self-contained WEB3 Assignment 3 snapshot.

## Run

Use Node 22 (`nvm use` when using nvm), then:

```bash
npm install
npm run dev
```

- Vue client: http://localhost:5174
- GraphQL HTTP: http://localhost:4000/
- GraphQL subscriptions: ws://localhost:4001/graphql

Open two browser profiles/private windows, register different users, create/join the same game, and start it from the host.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

The server is authoritative. Client requests express intent; UNO rules execute only in the copied OO domain model under `src/domain`. Opponent hands are projected to card counts before GraphQL sends state to a viewer.
