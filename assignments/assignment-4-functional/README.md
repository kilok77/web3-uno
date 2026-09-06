# Assignment 4 — Functional UNO

Independent immutable/pure-function TypeScript implementation of the UNO model from Assignment 1.

## What is implemented

- immutable plain-value Deck, Round, and Game state
- pure state-transition functions for play, draw, UNO declaration/catching, scoring, and round progression
- full numbered/action/Wild/Wild Draw Four behavior
- draw-pile recycling and two-player special-card behavior
- Round mementos
- multi-round Game scoring and winner detection
- seat rotation between rounds while preserving stable game score indices
- lodash-based functional utilities as required by the assignment

The original supplied functional Jest harness is included unchanged under `__test__/`.

## Verify

Use Node 22, then run:

```bash
npm install
npm run typecheck
npm test
```

Expected supplied result: **6/6 suites, 185/185 tests passing**.

See [`../../docs/assignment-4.md`](../../docs/assignment-4.md) for the verified contract and implementation notes.
