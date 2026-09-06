# Assignment 1 Public API Contract

This document derives the observable Assignment 1 contract from the supplied specification, rules PDF, Jest suite, and adapters. It does not prescribe private architecture or implement the model.

## Confidence labels

- **CONFIRMED** — directly required or observed in a supplied source. The evidence is named.
- **INFERRED** — the most economical design implied by confirmed behavior, but not directly fixed.
- **UNSPECIFIED** — the supplied sources do not decide it, disagree, or contain an apparent defect.

Where the written requirement tier and the test suite differ, both are recorded. Tests are evidence of the expected API, but their existence does not promote a written Could-have to Must-have.

## Sources and authority

- Assignment specification: [`../reference/assignments/WEB3 Assignment 1.docx`](<../reference/assignments/WEB3 Assignment 1.docx>)
- Supplied rules: [`../reference/rules/UNO rules.pdf`](<../reference/rules/UNO rules.pdf>)
- Extracted OO suite: [`../reference/tests/oo-model/`](../reference/tests/oo-model/)
- Original untouched suite archive: [`../reference/tests/oo model.zip`](<../reference/tests/oo model.zip>)

The specification makes the standard supplied UNO rules authoritative and explicitly includes two-player UNO. The repository policy resolves concrete API conflicts in favor of supplied tests/specification while requiring uncertainty to be documented.

## Requirement tiers

### Must have — CONFIRMED by specification

- Use an object-oriented design as far as practical.
- Define a precise `Card` type that permits standard UNO cards, including specials but excluding blanks, and prevents non-cards as far as TypeScript allows.
- Define types for numbered cards, all colored cards, and wild cards.
- Define `Type` for the UNO card kinds.
- Define `TypedCard<Type>` for cards of a specified type.
- Define a `Deck` interface/type and implementation for a complete UNO deck, reusable for piles if desired.
- Define a player-hand interface/type and implementation.
- Define a Round/hand interface/type and implementation for standard UNO, except the UNO-declaration rules.
- Include the standard two-player variations because the specification explicitly treats them as standard.

Evidence: Assignment specification, “Requirements — Must have” and task preamble.

### Should have — CONFIRMED by specification

- Implement saying UNO, including the supplied going-out rules.

Evidence: Assignment specification, “Should have”; rules PDF, “Going Out.”

### Could have — CONFIRMED by specification

- Define and implement a multi-round `Game` with scoring.
- Make as much of the supplied test suite as relevant pass.
- Define memento types.

Evidence: Assignment specification, “Could have.” The suite nevertheless has extensive Game and memento tests, so these remain planned after Must/Should behavior.

### Testing and implementation advice — CONFIRMED by specification

- The supplied tests use Jest and a behavior-driven style.
- Work one test/behavior at a time rather than attempting the whole model at once.
- Implement mementos early to reduce rework and to simplify complex test setup.
- Implement the relevant adapter functions because the suite intentionally avoids requiring a particular constructor/factory design.
- The assignment text says passing the teacher's entire suite is not itself mandatory and acknowledges possible rule interpretations. Repository policy still preserves the supplied suite unchanged and records deliberate differences instead of weakening assertions.

## Card model contract

### Structural values — CONFIRMED

```ts
type Color = "BLUE" | "GREEN" | "RED" | "YELLOW";

type Type =
  | "NUMBERED"
  | "SKIP"
  | "REVERSE"
  | "DRAW"
  | "WILD"
  | "WILD DRAW";

type NumberedCard = {
  type: "NUMBERED";
  color: Color;
  number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
};

type ColoredActionCard = {
  type: "SKIP" | "REVERSE" | "DRAW";
  color: Color;
};

type WildCard = {
  type: "WILD" | "WILD DRAW";
};

type Card = NumberedCard | ColoredActionCard | WildCard;
```

The object shapes and literals are confirmed by `deck.test.ts:10-88,132-165`, `predicates.ts:3-29`, and all round memento fixtures. The exact TypeScript declaration form above is **INFERRED**: structural object access is fixed, while aliases versus interfaces/classes are not.

### Required type concepts

| Concept | Contract | Confidence and evidence |
|---|---|---|
| `Color` | The four uppercase literals above | **CONFIRMED** by `predicates.ts:1-8`, all card fixtures, and iteration over `deck.colors` in `deck.test.ts:47-52` |
| `Type` | The six uppercase/space-containing literals above | **CONFIRMED** by the specification and `predicates.ts:1-29` |
| `Card` | Discriminated structural union; colored cards have `color`, numbered cards additionally have `number`, wilds have neither in tested shapes | **CONFIRMED** shape; **INFERRED** declaration form |
| `NumberedCard` | A type for numbered colored cards | **CONFIRMED** concept by specification; exact exported name **INFERRED** |
| `ColoredCard` | A type covering every card with a color, including numbered cards | **CONFIRMED** concept by specification; exact exported name and whether it includes numbered cards are **INFERRED** |
| `WildCard` | A type covering ordinary Wild and Wild Draw Four | **CONFIRMED** concept; exact exported name **INFERRED** |
| `TypedCard<T extends Type>` | Select the member(s) of `Card` with `type: T`, naturally expressible as `Extract<Card, {type: T}>` | Name and purpose **CONFIRMED** by specification; implementation **INFERRED** |

To satisfy “as precisely as you can,” impossible combinations should be excluded at compile time: no uncolored numbered/action cards, no `number` on action/wild cards, and only 0–9 on numbered cards. This precision is **CONFIRMED** as a requirement, although no supplied test performs TypeScript negative-type assertions.

### Other deck-module exports — CONFIRMED

The tests directly expect these exports from `src/model/deck`:

```ts
const colors: readonly Color[];
function hasColor(card: Card, color: Color): boolean;
function hasNumber(card: Card, number: number): boolean;
```

Evidence: `deck.test.ts:5,47-52,144-157`. Their use as TypeScript type guards is **INFERRED** and desirable, but only boolean behavior is observed. Color array ordering is **UNSPECIFIED**.

The suite never constructs a card directly. Constructors, classes, card factories, object freezing, and instance identity are **UNSPECIFIED** and remain design choices. Plain structural objects are the least-coupled choice because mementos and predicates use them directly.

## Deck contract

### Observable interface

```ts
type CardPredicate = (card: Card) => boolean;
type Shuffler<T> = (values: T[]) => void;

interface Deck {
  readonly size: number;
  filter(predicate: CardPredicate): Deck;
  shuffle(shuffler: Shuffler<Card>): void;
  deal(): Card | undefined;
  top(): Card | undefined;
  peek(): Card | undefined;
  toMemento(): CardMemento[];
}
```

This is the minimum combined surface touched by tests. `size`, `filter`, `shuffle`, `deal`, and `toMemento` are directly exercised in `deck.test.ts:8-209`; `top` and `peek` are exercised through Round piles in `round.start.test.ts:61-70`, `round.memento.test.ts:53-59`, and `round.playing.test.ts:318-356`. Whether all three logical roles use one concrete Deck class is **INFERRED**, not fixed.

### Operation behavior

| Name | Input | Output | State change / error | Confidence |
|---|---|---|---|---|
| `size` | — | nonnegative number | Observes remaining cards | **CONFIRMED** |
| `filter` | predicate | independent deck-like result | Result contains matching cards; source preservation is **INFERRED** from repeated use | Result/API **CONFIRMED** |
| `shuffle` | mutating `Shuffler<Card>` | return value unobserved | Calls shuffler with the deck's card array | **CONFIRMED**; exact return **UNSPECIFIED** |
| `deal` | — | next `Card`, then `undefined` when empty | Removes index 0/top card | **CONFIRMED** |
| `top` / `peek` | — | top `Card` or plausibly `undefined` | Non-removing observation | Presence **CONFIRMED**; empty behavior **UNSPECIFIED** |
| `toMemento` | — | ordered card memento array | No tested mutation | **CONFIRMED** |

### Full deck composition — CONFIRMED

| Cards | Per color | Total |
|---|---:|---:|
| Number 0 | 1 | 4 |
| Numbers 1–9 | 2 each | 72 |
| Skip | 2 | 8 |
| Reverse | 2 | 8 |
| Draw Two (`DRAW`) | 2 | 8 |
| Wild | — | 4 |
| Wild Draw Four (`WILD DRAW`) | — | 4 |
| Total excluding blanks | — | 108 |

Evidence: rules PDF “Contents” and `deck.test.ts:8-89`. Order before shuffling is **UNSPECIFIED**. The array after the injected shuffler defines deal order, with index 0 dealt first (`deck.test.ts:101-125`).

## Hand contract

### CONFIRMED

- A hand abstraction and implementation are mandatory by the specification.
- Tests observe a hand only via `Round.playerHand(playerIndex)` and require array operations/properties: `length`, `at`, and `forEach`.
- Repeated lookup for the same player returns the same object identity (`round.start.test.ts:58-60`).
- A dealt/drawn card is appended; a played card is removed by zero-based index (`round.playing.test.ts:30-36,284-298`).
- Round setup uses contiguous blocks from the shuffled deck: player 0 receives indexes `0..cardsPerPlayer-1`, then player 1, and so on (`round.start.test.ts:52-56`, `shuffling.ts:48-116`).

### INFERRED public view

```ts
type HandView = ReadonlyArray<Card>;
```

The internal implementation can be a class, but returning a stable readonly array view satisfies observed iteration/indexing without allowing callers to add/remove cards. The tests do not import a `Hand` symbol or construct hands directly.

### UNSPECIFIED

Exact Hand type/export name, public add/remove methods, direct hand mementos, mutation visibility through retained references, invalid player-index behavior for `playerHand`, and whether the returned array is frozen.

## Round construction contract

Construction is adapter-mediated:

```ts
type HandConfig = {
  players: string[];
  dealer: number;
  shuffler?: Shuffler<Card>;
  cardsPerPlayer?: number;
};

createRound(config: HandConfig): Round;
createRoundFromMemento(
  memento: RoundMemento,
  shuffler?: Shuffler<Card>
): Round;
```

The adapter defaults `shuffler` to `standardShuffler` and `cardsPerPlayer` to 7 (`test_adapter.ts:17-34`). Production constructor/factory names are **UNSPECIFIED**.

### Initial state — CONFIRMED

- Player count is 2–10; fewer or more throws (`round.start.test.ts:28-33`; rules PDF says 2–10).
- `player(index)` returns the configured string and throws outside bounds (`round.start.test.ts:19-37`).
- `dealer` exposes the configured index in normal fixtures.
- The deck is shuffled, hands are dealt in contiguous player blocks, the next card becomes the only discard, and the rest remain in draw order.
- Clockwise means increasing player indexes with wrap; ordinary play begins one place left of the dealer.

`cardsPerPlayer` exists to make tests small. Seven is the standard/default. Valid ranges other than the exercised positive values are **UNSPECIFIED**.

## Round observable API

| Name | Inputs | Output | State changes | Errors / invalid calls | Evidence | Confidence |
|---|---|---|---|---|---|---|
| `playerCount` | — | number | None | — | `round.start.test.ts:19-20` | **CONFIRMED** |
| `dealer` | — | player index | None | — | `round.start.test.ts:38-40`; memento tests | **CONFIRMED** |
| `player` | player index | player string | None | Throws for negative/out-of-range | `round.start.test.ts:22-37` | **CONFIRMED** |
| `playerHand` | player index | stable array-like card view | Observes later play/draw mutation | Index errors untested | `round.start.test.ts:46-60`; playing tests | **CONFIRMED** surface |
| `drawPile` | — | Deck/pile object | Returned object is live and tests sometimes deal from it | — | `round.start.test.ts:66-70`; playing tests | **CONFIRMED** |
| `discardPile` | — | Deck/pile object | Returned object is live enough to observe plays | — | `round.start.test.ts:61-65`; playing tests | **CONFIRMED** |
| `playerInTurn` | — | player index or `undefined` after end | Reflects current direction/actions | — | start, playing, going-out tests | **CONFIRMED** |
| `canPlay` | card index in current hand | boolean | None | Returns false for invalid index and after end | `round.legal.plays.test.ts`; `round.going.out.test.ts:250-255` | **CONFIRMED** |
| `canPlayAny` | — | boolean | None | False after end | `round.playing.test.ts:239-267`; going-out test | **CONFIRMED** |
| `play` | card index; required chosen `Color` only for wilds | played `Card` | Removes hand card, prepends discard, updates color/direction/turn, resolves effects; may end round | Throws for invalid index, incompatible card, wrong/missing color argument, or ended round | `round.playing.test.ts:8-237`; going-out test | **CONFIRMED** |
| `draw` | — | return unobserved | Appends top draw card; keeps turn if playable, otherwise advances; recycles piles | Throws after round end; other invalid timing untested | `round.playing.test.ts:239-381` | State **CONFIRMED**, return **UNSPECIFIED** |
| `sayUno` | player index | return unobserved | Protects imminent penultimate play or cures exposure before accusation | Throws for invalid index and after end | `round.going.out.test.ts:72-93,163-181,211-216,263-265` | **CONFIRMED** effects |
| `catchUnoFailure` | `{accuser: number, accused: number}` | boolean | On success, gives accused four cards and consumes catch opportunity | Accused bounds throw; accuser bounds untested | `round.going.out.test.ts:6-218` | **CONFIRMED** |
| `hasEnded` | — | boolean | None | — | `round.going.out.test.ts:220-266` | **CONFIRMED** |
| `winner` | — | player index or `undefined` | None | — | `round.going.out.test.ts:228-251` | **CONFIRMED** |
| `score` | — | number or `undefined` | None | — | `round.going.out.test.ts:269-352` | **CONFIRMED** |
| `onEnd` | callback receiving `{winner: number}` | return unobserved | Registers callback invoked once at round end; multiple callbacks supported | Unsubscribe/error behavior untested | `round.going.out.test.ts:354-381` | **CONFIRMED** |
| `toMemento` | — | `RoundMemento` | None expected | — | `round.memento.test.ts:205-209` | **CONFIRMED** |

## Initial-discard behavior

| First discard | Required result | Evidence | Confidence |
|---|---|---|---|
| Numbered | Current color is its color; player left of dealer starts clockwise | `round.start.test.ts:99-107`; rules PDF | **CONFIRMED** |
| Skip | Player left of dealer is skipped; player two places left starts | `round.start.test.ts:118-122`; rules PDF | **CONFIRMED** |
| Reverse | Direction becomes counterclockwise; player right of dealer starts | `round.start.test.ts:108-117`; rules PDF | **CONFIRMED** |
| Draw Two | Player left draws two and forfeits the turn | Hand growth **CONFIRMED** by `round.start.test.ts:123-127`; forfeiting turn **CONFIRMED** by rules but untested |
| Wild | Reshuffle/retry until the first discard is non-wild | `round.start.test.ts:72-88` | **CONFIRMED by tests** despite conflicting PDF prose |
| Wild Draw Four | Return/retry until non-wild | `round.start.test.ts:89-95`; rules PDF | **CONFIRMED** |

The PDF's Set Up section says both wild types are returned, while its Wild section says the player left of dealer chooses the starting color. This internal source conflict is resolved for this implementation by the explicit Wild reshuffle tests.

## Legal-play contract

### CONFIRMED

For a non-wild candidate, a play is compatible when:

1. the candidate color equals `currentColor`; or
2. both top/candidate are numbered and their numbers match; or
3. both top/candidate have the same action type among `SKIP`, `REVERSE`, and `DRAW`.

An ordinary `WILD` is playable regardless of hand contents. Playing either wild requires choosing one of the four colors. Current color becomes that choice; wild card mementos themselves remain uncolored.

`WILD DRAW` legality is narrower than “no other playable card”: it is legal exactly when the player has no card whose color equals the current color. A matching number/action in another color and an ordinary Wild do not prohibit it.

Evidence: all 48 cases in `round.legal.plays.test.ts`, especially lines 205–339; rules PDF Wild Draw Four section.

### UNSPECIFIED

- The rules describe challenging an illegal Wild Draw Four, including reveal and four/six-card outcomes, but tests/adapters expose no challenge operation.
- Runtime handling of invalid chosen-color strings is not tested.
- Whether `canPlay` considers a post-draw restriction that only the drawn card may be played is not tested.

## Drawing contract

### CONFIRMED by supplied rules

- A player may voluntarily decline a playable hand card and draw (“Reneging”).
- If the drawn card is playable, it may be played immediately.
- After drawing, another pre-existing hand card may not be played that turn.
- If the drawn card is not played, play advances.

### CONFIRMED by tests

- The drawn card is removed from index 0 of the draw pile and appended to the current hand.
- If it is playable, `playerInTurn()` remains unchanged; if unplayable, the turn advances.
- When the draw pile is depleted, the top discard stays put and every older discard is shuffled into a new draw pile. The test expects this recycling immediately after drawing the last available card.
- Penalty draws can cross a pile-recycling boundary.

Evidence: `round.playing.test.ts:239-381`; rules PDF “Let's Play,” “Reneging,” and “Going Out.”

### UNSPECIFIED by tests

Whether `draw()` throws when a hand card is playable, its return type, how an empty draw pile with only one discard is handled, and the API/state needed to enforce “only the newly drawn card.” The rules answer the first question (drawing is allowed) and require the post-draw restriction even though tests do not.

## Special-card contract

| Card | Normal multiplayer behavior | Initial discard | Two-player behavior | Interaction with round ending |
|---|---|---|---|---|
| Skip | Next player loses turn | Player left of dealer is skipped | Playing it returns play to the same player | Ending is immediate; no extra penalty cards |
| Reverse | Reverse direction, then advance in new direction | Reverse direction; player right of dealer starts | Acts like Skip and returns play to same player | Ending is immediate |
| Draw Two (`DRAW`) | Next player draws two and loses turn | First player draws two and loses turn | Opponent draws two, then play returns to actor | If final card, opponent still draws and cards count in score |
| Wild | Choose any color, including current; advance normally | Tests require retrying the shuffle | No special difference supplied | Ending is immediate after chosen color is supplied |
| Wild Draw Four (`WILD DRAW`) | Only legal with no current-color card; choose color; next player draws four and loses turn | Retry initial discard | Opponent draws four, then play returns to actor | Rules require final four-card draw before scoring; not directly tested |

Evidence: rules PDF “Special Cards,” “Going Out,” and “Rules for Two Players”; `round.start.test.ts`, `round.playing.test.ts`, and `round.going.out.test.ts`.

Challenge rules for Wild Draw Four are source-required standard behavior but API-**UNSPECIFIED**: only the player required to draw may challenge; guilty actor draws four; unsuccessful challenger draws six total. A later design decision must expose this without inventing test-facing names prematurely.

## Two-player contract

### CONFIRMED by rules

- Reverse acts like Skip; after playing it, the same player acts again.
- Skip returns the turn to the same player.
- After Draw Two or Wild Draw Four, the opponent draws the indicated cards and play returns to the actor.

### CONFIRMED by tests

- Reverse returns the turn to its actor (`round.playing.test.ts:383-393`).
- Penalty-card scoring fixtures indirectly require final Draw Two penalties in a two-player round (`round.going.out.test.ts:328-336`).

Ordinary Skip and non-final two-player penalty-turn transitions are not directly tested but remain Must-have because the specification incorporates the rules PDF.

## UNO declaration state machine

UNO is a state transition, not a permanent player boolean.

```text
NO ACTIVE DECLARATION
  ├─ current player says UNO immediately around penultimate play
  │      └─ protected when hand becomes one card
  └─ player reaches one card without effective declaration
         └─ EXPOSED / CATCHABLE
              ├─ exposed player says UNO before accusation → SAFE (self-catch)
              ├─ valid accusation → +4 cards, RESOLVED
              ├─ wrong accusation → remains EXPOSED
              └─ next player begins by play/draw → EXPIRED / SAFE
```

### CONFIRMED

- The declaration concerns the play that reduces a hand from two cards to one.
- It may be made just before that card touches the discard, or after the play as a self-catch if no opponent has caught the player.
- Any tested player can accuse; success returns `true`, adds four cards to the accused, and closes that opportunity.
- A wrong target returns `false` without closing another player's real opportunity.
- The next player's `play()` or `draw()` closes the preceding catch window.
- A declaration made too early is not durable across intervening player actions; it cannot insure a later penultimate play.
- Multiple players' declarations/exposures require player-specific timing rather than one global “UNO was said” flag.
- The exposed player need not be the player currently in turn.

Evidence: rules PDF “Let's Play” and “Going Out”; `round.going.out.test.ts:6-218`.

### UNSPECIFIED

- `sayUno` return value.
- Any consequence for saying UNO at an incorrect time. Tests imply a premature call is simply ineffective later.
- Whether an accuser may equal the accused in `catchUnoFailure`; the PDF's self-catch is exercised through `sayUno`, not this method.
- Accuser index validation.
- Memento representation of pending declaration/exposure state. Current exact Round mementos contain no such field.

## Round completion and scoring

### CONFIRMED

- The round ends when a player plays their last card.
- `winner()` is `undefined` before end and then returns that player's index.
- `playerInTurn()` becomes `undefined` at end.
- `canPlay`/`canPlayAny` return false after end; `play`, `draw`, and `sayUno` throw.
- `score()` is `undefined` before end and afterward sums cards held by every opponent.
- Numbered cards score face value; `DRAW`, `REVERSE`, and `SKIP` score 20; `WILD` and `WILD DRAW` score 50.
- A final Draw Two or Wild Draw Four penalty resolves before totals are calculated. Draw Two is directly tested; Wild Draw Four is explicit in the rules.
- All `onEnd` subscribers receive `{winner: playerIndex}` exactly once when the round ends.

Evidence: `round.going.out.test.ts:220-381`; rules PDF “Going Out” and “Scoring.”

Exact error types/messages, callback unsubscribe semantics, and whether callback failures affect other callbacks are **UNSPECIFIED**.

## Full Game contract

Full Game is **Could-have**, not mandatory, even though two test files describe it.

### Adapter construction

```ts
type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

createGame(config: Partial<GameConfig>): Game;
createGameFromMemento(
  memento: GameMemento,
  randomizer?: Randomizer,
  shuffler?: Shuffler<Card>
): Game;
```

`Randomizer(bound)` returns an integer in `0..bound-1` by its supplied utility contract. Adapter defaults must provide omitted configuration. Evidence: `test_adapter.ts:36-46`, `random_utils.ts:1-19`.

### Observable API

| Name | Input | Output / behavior | Evidence | Confidence |
|---|---|---|---|---|
| `playerCount` | — | count of players | `uno.test.ts:5-9` | **CONFIRMED** |
| `player` | index | configured string; throws out of bounds | `uno.test.ts:10-15,44-47` | **CONFIRMED** |
| `targetScore` | — | configured positive target, default 500 | `uno.test.ts:22-28,41-43` | **CONFIRMED** |
| `score` | index | positional cumulative score, initially zero | `uno.test.ts:29-34` and round transitions | **CONFIRMED**; bounds behavior **UNSPECIFIED** |
| `winner` | — | index of player at/above target, else `undefined` | `uno.test.ts:35-37,194-205` | **CONFIRMED** |
| `currentRound` | — | stable current Round or `undefined` after game end | `uno.test.ts:48-58,84-205` | **CONFIRMED** |
| `toMemento` | — | exact `GameMemento` | `uno.memento.test.ts:109-117` | **CONFIRMED** |

### Lifecycle — CONFIRMED

- Defaults: players `['A', 'B']`, target 500, standard randomizer/shuffler, and seven cards per player (the latter two follow adapter defaults/inference).
- At least two players and target score greater than zero are required.
- Initial scores are zero and an initial round starts immediately.
- The injected randomizer selects the initial dealer.
- A restored/created Game must subscribe to Round completion: add the round score to its winner, then create a new round unless that total reaches/exceeds target.
- At target, expose the winner and no current round.

Dealer selection or rotation after the first round is **UNSPECIFIED**. The tests do not establish whether later dealers rotate, remain fixed, or are randomized. The rules PDF selects a dealer during setup but does not define a programmatic multi-round rotation.

## Memento contract

Mementos are plain public JSON-compatible objects with no methods, per the specification.

### CardMemento — CONFIRMED shape

```ts
type CardMemento =
  | {type: "NUMBERED"; color: Color; number: number}
  | {type: "SKIP" | "REVERSE" | "DRAW"; color: Color}
  | {type: "WILD" | "WILD DRAW"};
```

Restoration throws for unknown type and tested missing mandatory fields. Runtime rejection of out-of-range numbers, invalid colors, prohibited extras, or wild cards with colors is **UNSPECIFIED**, although the compile-time Card type should prevent impossible values.

### Deck memento — CONFIRMED shape

An ordered `CardMemento[]`; element 0 is the next card dealt/top. Empty is valid. `toMemento()` exactly reproduces a supplied valid array (`deck.test.ts:130-209`). No named `DeckMemento` export is imported by tests.

### RoundMemento — CONFIRMED test-facing shape

```ts
type CurrentDirection = "clockwise" | "counterclockwise";

interface RoundMemento {
  players: string[];
  hands: CardMemento[][];
  drawPile: CardMemento[];
  discardPile: CardMemento[]; // index 0 is top
  currentColor: Color;
  currentDirection: CurrentDirection;
  dealer: number;
  playerInTurn?: number; // absent only for a finished round
}
```

Confirmed validation:

- at least two players;
- same number of hands and players;
- not more than one empty hand;
- nonempty discard pile;
- valid `currentColor`;
- if top discard is colored, `currentColor` equals its color;
- dealer in bounds;
- unfinished round has in-bounds `playerInTurn`;
- a round with one empty hand may omit `playerInTurn`.

Evidence: `round.memento.test.ts:6-209`. Maximum ten players on restoration, card-level validation beyond Deck cases, strict direction validation, duplicate player names, wild/current-color consistency, extra fields, and pending UNO state are **UNSPECIFIED**.

`toMemento()` deep-equals the input fixture. Therefore adding always-present fields such as `status`, `winner`, or `unoState` would break confirmed tests unless adapters/projectors remove them.

### GameMemento — CONFIRMED test-facing shape

```ts
interface GameMemento {
  players: string[];
  currentRound?: RoundMemento;
  targetScore: number;
  scores: number[];
  cardsPerPlayer: number;
}
```

Confirmed validation:

- at least two players;
- positive target score;
- all scores nonnegative;
- score count equals player count;
- at most one score meets/exceeds target;
- unfinished game requires a current round;
- finished game is inferred from the score and may omit current round.

Evidence: `uno.memento.test.ts:4-117`. A current round in an already-finished game, nested player consistency, maximum players, cards-per-player constraints, and extra fields are **UNSPECIFIED**.

There is no separate tested `HandMemento`: hands are nested card arrays in `RoundMemento`.

## Test Adapter Contract

The adapter layer fixes capabilities, not private constructors.

| Adapter | Must eventually create/expose | Design decisions still ours |
|---|---|---|
| `createInitialDeck()` | A fresh complete 108-card `Deck` | Constructor/factory name, internal storage, card object allocation |
| `createDeckFromMemento(cards)` | Ordered restored Deck with validation | Static factory vs constructor vs mapper; error classes |
| `createRound(config)` | New Round with configurable players, dealer, shuffler, and hand size | Production config shape, dependency injection mechanism, internal Hand/pile classes |
| `createRoundFromMemento(memento, shuffler)` | Restored Round that can recycle with injected shuffler | Static restore API, validation organization |
| `createGame(partialConfig)` | New Game with defaults and injectable randomizer/shuffler | Production defaults vs adapter defaults, constructor/factory |
| `createGameFromMemento(memento, randomizer, shuffler)` | Restored live Game observing its Round | Restore and subscription architecture |

Direct imports fix these module-level symbols for the supplied harness unless the runnable snapshot deliberately adapts paths:

- `src/model/deck`: `Card`, `Color`, `Type`, `Deck`, `colors`, `hasColor`, `hasNumber`.
- `src/model/round`: `Round`.
- `src/model/uno`: `Game`, `GameMemento`.
- `src/utils/random_utils`: already-supplied `Randomizer`, `Shuffler`, `standardRandomizer`, `standardShuffler`.

No card, deck, round, or game constructor is called directly by tests. The suite does not require imitating the teacher's internal architecture.

The preserved adapter file is intentionally empty and uses `any` placeholders. Future implementation must not edit the reference copy. The runnable Assignment 1 snapshot should contain a deliberate copy/integration of the harness where its adapter can be implemented without altering original source material.

## Known suite defects and ambiguities

- Several two-player score fixtures pass dealer index `3` for two players. Memento tests explicitly reject out-of-bounds dealers. Whether new-round construction should normalize dealer modulo player count, the adapter should normalize, or the fixtures are erroneous is **UNSPECIFIED** and must be handled narrowly when implementing those tests.
- `round.playing.test.ts:308` says “unplayable” in its title but draws a playable same-color card and expects the player to remain in turn. Treat the title as a typo.
- `uno.memento.test.ts:96` writes `expect(game.currentRound()).toBeUndefined` without calling the matcher. Other Game tests confirm the intended absent-round behavior.
- The PDF contradicts itself about an initial ordinary Wild; tests require reshuffling it.
- The specification says tests may be modified and need not pass, while repository policy preserves supplied tests. Preserve the reference suite and adapt only a working copy/harness in the assignment snapshot.
- The required Wild Draw Four challenge has no supplied adapter/API or tests.
- Round mementos cannot currently preserve an active UNO declaration/catch window without adding fields that would fail exact-equality tests.

## Proposed implementation sequence

Implement each step in the independent `assignments/assignment-1-oo/` snapshot. Establish a working harness copy/integration as soon as a feature needs tests, while leaving `reference/tests/oo-model/` untouched.

| Step | Scope and dependency | Test files expected to become green |
|---|---|---|
| A1.2 | Precise Card/Color/Type unions, required card category types, `TypedCard<T>`, `colors`, `hasColor`, `hasNumber` | TypeScript compilation of `predicates.ts`, `shuffling.ts`, and card-dependent tests; no dedicated runtime card test exists |
| A1.3 | Deck/pile implementation, complete 108-card factory, ordering, shuffle/filter/deal/top/peek, card/deck restoration | `deck.test.ts` fully green |
| A1.4 | Encapsulated Hand implementation with stable readonly view and indexed remove/append | No dedicated file; prerequisite behavior for all Round tests |
| A1.5 | Round memento types, validation/restoration skeleton, player/pile accessors | `round.memento.test.ts` restoration/validation cases; direction-play cases finish with core play |
| A1.6 | Fresh Round initialization, contiguous dealing, initial discard retry/effects, direction/index helpers | `round.start.test.ts` fully green |
| A1.7 | Compatibility predicates and basic numbered-card play | Number/color/action matching portions of `round.legal.plays.test.ts`; numbered-play portion of `round.playing.test.ts` |
| A1.8 | Drawing/reneging turn phase and enforcement that only the newly drawn playable card may be used | `canPlayAny` and ordinary draw portions of `round.playing.test.ts`; source-only restriction additionally covered by student tests |
| A1.9 | Skip behavior including two-player repeat turn | Skip portions of `round.playing.test.ts`; add source-derived two-player tests |
| A1.10 | Reverse behavior, persistent direction, and two-player Skip equivalence | Reverse and explicit two-player portions of `round.playing.test.ts` |
| A1.11 | Draw Two penalties, skipped victim, initial effect, and final-card penalty | Draw portions of `round.playing.test.ts`; Draw-related start/scoring cases |
| A1.12 | Wild chosen-color behavior and color-argument validation | Wild portions of `round.legal.plays.test.ts` and `round.playing.test.ts` |
| A1.13 | Wild Draw Four legality/effect/final penalty; make an explicit design decision for source-required challenge API | `round.legal.plays.test.ts` fully green; Wild Draw portions of `round.playing.test.ts`; source-derived challenge tests |
| A1.14 | Draw-pile recycling for normal, penalty, and UNO-penalty draws | Recycling portions of `round.playing.test.ts` and `round.going.out.test.ts` |
| A1.15 | UNO declaration/catching state machine and four-card penalty | Catching/UNO portions of `round.going.out.test.ts` |
| A1.16 | Round terminal state, final action resolution, scoring, and end callbacks | `round.going.out.test.ts` fully green |
| A1.17 | Round serialization round-trip hardening, including a documented decision about pending UNO state | `round.memento.test.ts` fully green |
| A1.18 | Optional full Game lifecycle, cumulative scoring, restoration, defaults, and terminal state | `uno.test.ts` and `uno.memento.test.ts` fully green |
| A1.19 | Adapter/test-harness cleanup, close source-rule gaps with student tests, run full strict TypeScript and Jest suite | All eight supplied model test files (238 tests), plus any source-derived tests |

Before A1.5/A1.18 implementation, resolve the out-of-range two-player dealer fixture narrowly and record the decision. Before adding memento fields beyond the confirmed shapes, decide how to preserve exact adapter-facing equality.
