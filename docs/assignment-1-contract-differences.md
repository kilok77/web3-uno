# Assignment 1 Contract Differences

These are deliberate Assignment 1 adaptations discovered from authoritative materials. The semester-wide [`domain-contract.md`](domain-contract.md) remains conceptual and already permits assignment-specific representations, so it has not been silently rewritten.

## Card type alias name

Conceptual repository contract: The illustrative shared vocabulary names the union `CardType`.

Assignment 1 source requirement: The specification explicitly requires a type named `Type`, and the test helpers import `Type` from `src/model/deck`.

Decision: Assignment 1 must export `Type` with literals `NUMBERED`, `SKIP`, `REVERSE`, `DRAW`, `WILD`, and `WILD DRAW`. A future boundary may alias it to `CardType`; tests must not be forced to use the conceptual name.

## Direction serialization

Conceptual repository contract: Direction is illustrated as `"CLOCKWISE" | "COUNTERCLOCKWISE"`, and the provisional Round shape uses a `direction` field.

Assignment 1 source requirement: Round memento fixtures use `currentDirection: "clockwise" | "counterclockwise"`.

Decision: Assignment 1's adapter-facing `RoundMemento` must use the confirmed lowercase values and `currentDirection` field. Later assignment boundaries may explicitly map this representation to the shared conceptual vocabulary.

## Player addressing and hands

Conceptual repository contract: Stable `PlayerId` strings and ID-keyed hand records are the intended later multiplayer boundary.

Assignment 1 source requirement: Players are strings in an ordered array, hands are a parallel array, and every Round/Game operation addresses players by numeric index. No `displayName` or separate stable ID exists.

Decision: Preserve the Assignment 1 positional contract. Do not prematurely add multiplayer identity. A later assignment must introduce stable IDs through an explicit projection/migration rather than treating a display label as identity.

## Game score serialization

Conceptual repository contract: The provisional `GameMemento` illustrates `scores` as `Record<PlayerId, number>` and includes an optional `gameId`.

Assignment 1 source requirement: `GameMemento.scores` is a positional `number[]` aligned with `players`; there is no `gameId` field, and exact round-trip tests reject extra output fields.

Decision: Use the positional array and omit `gameId` in Assignment 1's test-facing memento. Introduce `GameId` only when a later assignment has actual multiplayer identity requirements.

## Round and Game status

Conceptual repository contract: Provisional shapes mention explicit status, winner, target, and UNO-related state concepts.

Assignment 1 source requirement: Round completion is inferred from exactly one empty hand and an absent `playerInTurn`; Game completion is inferred from scores meeting `targetScore` and an absent `currentRound`. Confirmed Round mementos contain no UNO declaration/catch-window field.

Decision: Match the exact Assignment 1 mementos at the adapter boundary and derive status/winner. Do not add unconditional serialized fields that would break deep-equality tests. If durable mid-turn UNO restoration becomes necessary, introduce a versioned or adapter-projected extension deliberately.

## Full Game priority

Conceptual repository contract: Game state is part of the semester-wide serialization story.

Assignment 1 source requirement: The written specification classifies full `Game` and memento types as Could-have, although the suite contains 43 Game/memento tests.

Decision: Keep Game in the A1 implementation sequence, but after the Must-have Round and Should-have UNO behavior. Do not describe it as mandatory for the written Assignment 1 minimum.
