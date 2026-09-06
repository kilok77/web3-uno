# Assignment 2 — Vue + Web Worker bots

Browser-only UNO round built with Vue 3 Composition API and Pinia. The Assignment 1 OO domain model is copied into `src/domain/` so this assignment remains independently runnable and hand-in-ready.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## Architecture

- Vue components render state and send player intent.
- Pinia coordinates the browser application; it does not duplicate UNO rules.
- The copied Assignment 1 `Round` model remains the rules authority.
- Each bot runs in its own Web Worker and communicates only through `postMessage`/`onmessage` using `RoundMemento` snapshots and action messages.
- Bots deliberately have probabilistic UNO declaration/catching behavior while otherwise following legal-play checks from the domain model.
