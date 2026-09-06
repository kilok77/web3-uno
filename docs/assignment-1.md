# Assignment 1

## Goal

Create an object-oriented TypeScript implementation of standard UNO, including the supplied two-player variations, while keeping the domain independent from UI and networking.

## Technologies

TypeScript 5.x, Jest 29, and Babel's TypeScript transform, following the supplied harness configuration.

## Must-have requirements

- Use an object-oriented design as far as practical.
- Define a precise `Card` model, card-category types, `Type`, and `TypedCard<Type>`; exclude blank cards.
- Define and implement a complete `Deck` abstraction.
- Define and implement a player-hand abstraction.
- Define and implement standard Round/hand play except the rules for saying UNO.
- Include the supplied two-player rules as standard behavior.

## Should-have requirements

- Implement the stateful rules for saying UNO, self-correction, catching a missed declaration, and the four-card penalty.

## Could-have requirements

- Implement a full multi-round `Game` with cumulative scoring.
- Make the relevant supplied tests pass.
- Define JSON-compatible memento types and restoration.

Although Game and mementos are Could-have in the written specification, they have extensive supplied tests and are important to later assignments. They remain planned after the Must/Should domain behavior.

## Source files

- Assignment specification: [`../reference/assignments/WEB3 Assignment 1.docx`](<../reference/assignments/WEB3 Assignment 1.docx>)
- Supplied UNO rules: [`../reference/rules/UNO rules.pdf`](<../reference/rules/UNO rules.pdf>)
- Original OO test ZIP: [`../reference/tests/oo model.zip`](<../reference/tests/oo model.zip>)

The original source files are preserved unchanged.

## Test suite location

The ZIP was extracted to [`../reference/tests/oo-model/`](../reference/tests/oo-model/) for inspection. It contains 238 tests in eight model test files. Its adapter stubs permit different constructor/factory designs.

The reference extraction must remain pristine. When implementation begins, establish an independent Assignment 1 test harness/copy in [`../assignments/assignment-1-oo/`](../assignments/assignment-1-oo/) and implement adapters there.

## Derived documents

- [`assignment-1-api-contract.md`](assignment-1-api-contract.md) — exact confirmed/inferred/unspecified API and behavior contract.
- [`assignment-1-test-inventory.md`](assignment-1-test-inventory.md) — test-by-test-file inventory and priorities.
- [`assignment-1-contract-differences.md`](assignment-1-contract-differences.md) — deliberate differences from the conceptual semester contract.

## Implementation strategy

1. Implement the precise card/type system first.
2. Build Deck and memento parsing early.
3. Encapsulate Hand state behind stable readonly views.
4. Build Round behavior incrementally: initialization, compatibility, drawing, special cards, recycling, two-player behavior, UNO, completion, and scoring.
5. Add optional Game orchestration only after Round behavior is stable.
6. Use adapter seams rather than choosing production constructors to mimic an imagined teacher implementation.
7. Preserve source rules not directly covered by tests with focused student-owned tests, especially reneging/post-draw restrictions, two-player Skip/penalty transitions, final Wild Draw Four, and challenge behavior.

## Implementation status

- A1.1 complete
- A1.2 complete
- A1.3 complete
- A1.4 complete
- A1.5 complete
- A1.6 complete
- A1.7 complete
- A1.8 complete
- A1.9 complete
- A1.10 Wild and Wild Draw Four gameplay not started

## Notes

- Confirmed Assignment 1 mementos use positional player indexes and lowercase direction strings.
- The test suite expects both initial wild types to be reshuffled, resolving contradictory wording in the rules PDF.
- Wild Draw Four challenge behavior is required by the rules but has no supplied public API or test.
- Some two-player score fixtures use an out-of-range dealer index and require a narrow decision before implementation.
- Cards are readonly structural values modeled as a precise discriminated union in `src/model/deck.ts`. `Color` comes from a readonly `colors` tuple, numbered values are restricted to 0–9, `TypedCard<T>` is derived with `Extract`, and `hasColor`/`hasNumber` are narrowing type guards.
- `Deck` is a mutable object-oriented pile with index 0 as its top. `deal` and injected `shuffle` mutate it; `filter` returns an independent Deck; mementos are ordered plain card arrays validated during restoration.
- `Hand` owns an ordered card array, exposes a stable live readonly view, appends and removes cards without applying gameplay rules, and serializes to a defensive card-array copy for later Round mementos.
- `Round` initialization validates 2–10 players, shuffles once before contiguous dealing, retries wild initial discards within the remaining pile, and applies the tested initial Numbered, Skip, Reverse, and Draw Two state transitions.
- Round legality is centralized in a non-mutating predicate: color, number, and action-type matches are supported; ordinary Wild is always legal; Wild Draw Four checks only for another card matching the current color.
- Ordinary Round turns remove and prepend played numbered cards, update color, and advance in the current direction. Drawn cards append to the hand; an unplayable draw advances immediately, while a playable draw retains the turn with only that new card eligible.
- Skip and Reverse reuse the shared play transition. Skip advances two positions; Reverse flips direction before advancing, and both return play to the actor in a two-player round.

- Draw Two uses the same forced-card transfer helper as startup penalties, then advances two positions in the current direction. Forced cards never enter the voluntary playable-draw phase.
