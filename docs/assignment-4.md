# Assignment 4

## Goal

Reimplement the verified UNO behavior with immutable TypeScript data and pure functions.

## Verified requirements

The original Assignment 4 specification and `reference/tests/functional-test.zip` were inspected before implementation.

### Must have

- Convert the Assignment 1 object-oriented model to a functional model.
- Represent the corresponding types immutably.
- Implement the corresponding behavior as pure functions.
- Use lodash / lodash-fp for general utility operations instead of rebuilding utility helpers.

### Should have

- UNO declaration and catching behavior.

### Could have

- Full immutable functional Game orchestration.

The supplied functional suite also exercises the full Game, so this implementation includes it.

## Implementation

- `assignments/assignment-4-functional` is independently runnable and has no runtime dependency on another assignment folder.
- Cards, decks, rounds, and games are plain immutable values.
- `Round` transitions are free functions with the round value passed last where composition/partial application is expected by the supplied tests.
- Play, draw, Skip, Reverse, Draw Two, Wild, Wild Draw Four, recycling, UNO timing, final-card penalties, winner detection, and scoring preserve the verified Assignment 1 behavior.
- Round mementos are plain serializable values.
- Game orchestration folds completed-round scores into immutable game state and starts the next round until the target score is reached.
- Successive rounds rotate the seating order by one. A seat offset maps Round winner indices back to the stable Game player/score indices, matching the supplied Game contract.
- The public functional `Card` type follows the structural field assumptions made by the supplied TypeScript tests while runtime card objects still omit irrelevant fields.
- lodash is used for functional collection/rotation/scoring operations.

## Verification

Node 22 CI runs:

```bash
npm install --no-audit --no-fund
npm run typecheck
npm test
```

Verified result:

- TypeScript typecheck: passed
- Supplied functional Jest suites: **6/6 passed**
- Supplied functional tests: **185/185 passed**
- A1, A2, and A3 regression jobs remained green in the same workflow run

## Status

Complete. Assignment 5 is the next integration point: React + Redux + RxJS using the multiplayer lessons from A3 and the functional model from A4.
