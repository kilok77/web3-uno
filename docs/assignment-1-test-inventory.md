# Assignment 1 Test Inventory

## Scope and harness

The extracted suite is at [`../reference/tests/oo-model/`](../reference/tests/oo-model/). It contains 238 Jest tests across eight model test files. The suite is TypeScript transformed by Babel/Jest, with strict TypeScript configuration targeting ES2022. Production model files are expected under `src/model/`, but the supplied `src/model/` directory is empty.

The suite deliberately routes construction and restoration through [`test_adapter.ts`](../reference/tests/oo-model/__test__/utils/test_adapter.ts). Its functions are stubs intended to be connected to the student's chosen implementation. The preserved reference copy must remain unchanged; a future runnable Assignment 1 snapshot should use a deliberate test-harness copy or equivalent integration strategy.

## Card types and Deck

Test file: `__test__/model/deck.test.ts` (28 tests)

Purpose: Verify exact card literals, standard 108-card composition excluding blanks, pile operations, ordering, and deck memento validation.

Public API touched: adapter functions `createInitialDeck()` and `createDeckFromMemento(cards)`; exports `Card`, `Color`, `Type`, `Deck`, `colors`, `hasColor`, and `hasNumber` from `src/model/deck`; `Deck.size`, `filter`, `shuffle`, `deal`, and `toMemento`.

Important behavior:

- Four colors are used: `BLUE`, `GREEN`, `RED`, and `YELLOW`.
- Card types are `NUMBERED`, `SKIP`, `REVERSE`, `DRAW`, `WILD`, and `WILD DRAW`.
- Each color has one zero and two of each number 1–9: 19 numbered cards per color.
- Each color has two each of `SKIP`, `REVERSE`, and `DRAW`; the deck also has four `WILD` and four `WILD DRAW` cards.
- Total size is 108 because blank cards are omitted.
- `filter` returns a deck-like value with `size` and `deal`; use across tests implies the source deck is preserved.
- `shuffle` invokes the injected mutating shuffler.
- `deal` removes and returns cards from index 0 order, then returns `undefined` when empty.
- A deck restored from a card array preserves order, and `toMemento()` reproduces that array.
- Restoration throws for an unknown `type` and for missing required `color`/`number` fields tested for colored/numbered cards.

Implementation priority: Must-have for cards and Deck; memento support is Could-have in the written specification but is an early implementation enabler.

Notes / ambiguities: No test rejects an out-of-range number, unknown color, forbidden extra field, colored wild, or numbered action card. `colors` ordering, exact error classes/messages, `peek`, `top`, and factory/constructor design are not fixed here. Type-level precision is required by the specification but has no dedicated compile-time test.

## Round creation and initial discard

Test file: `__test__/model/round.start.test.ts` (21 tests)

Purpose: Verify player setup, dealing, initial piles, injected shuffling, and action-card effects before the first player action.

Public API touched: adapter `createRound(HandConfig)`; `Round.playerCount`, `dealer`, `player(index)`, `playerHand(index)`, `discardPile()`, `drawPile()`, and `playerInTurn()`; pile `size`, `top`, and `deal`.

Important behavior:

- A round accepts 2–10 players and rejects counts outside that range.
- Player lookup rejects negative and out-of-range indexes.
- The configured dealer index is observable.
- The shuffler is called once in an ordinary setup.
- Default hand size is seven.
- Test fixtures expect contiguous dealing: the first seven shuffled cards go to player 0, the next seven to player 1, rather than round-robin dealing.
- Repeated `playerHand(index)` calls return the same array identity.
- The next shuffled card becomes the sole discard; remaining cards retain order in the draw pile.
- An initial `WILD` or `WILD DRAW` triggers reshuffling until a non-wild first discard is obtained.
- An ordinary first discard starts with the player to the dealer's left; indexes increase clockwise and wrap.
- Initial `REVERSE` changes direction and starts with the player to the dealer's right.
- Initial `SKIP` skips the player to the dealer's left.
- Initial `DRAW` gives two cards to the first player. The test does not directly assert the resulting player-in-turn.

Implementation priority: Must-have Round setup.

Notes / ambiguities: Constructor/factory signatures are hidden behind the adapter. Dealer bounds are not tested here, and later score fixtures pass dealer `3` to a two-player round. Initial `DRAW` turn advancement is supplied by the rules PDF but incompletely asserted. The rules PDF itself gives conflicting prose for an initial ordinary Wild; the tests unambiguously require reshuffling it.

## Legal plays

Test file: `__test__/model/round.legal.plays.test.ts` (48 tests)

Purpose: Define card compatibility, selected-color behavior, Wild Draw Four restrictions, and invalid hand-index predicates.

Public API touched: `Round.canPlay(cardIndex)`, `Round.play(cardIndex, color?)`, and adapter `createRound`.

Important behavior:

- A colored card matches by current color.
- Numbered cards also match the same number across colors.
- `SKIP`, `REVERSE`, and `DRAW` also match the same action type across colors.
- Ordinary `WILD` is always playable.
- After a Wild, compatibility uses the chosen color.
- `WILD DRAW` is illegal only when the hand contains a card of the current color. A same-number or same-action card in another color, or an ordinary Wild, does not make it illegal.
- After an ordinary Wild, the same current-color restriction controls `WILD DRAW`.
- `canPlay` returns `false`, rather than throwing, for negative or out-of-range card indexes.

Implementation priority: Must-have Round rules.

Notes / ambiguities: Challenge behavior for an illegally played Wild Draw Four is mandatory under the supplied rules but has no test or adapter API. The suite does not test `canPlay` after drawing, whether only the drawn card remains eligible, or invalid color arguments.

## Playing, drawing, recycling, and two-player Reverse

Test file: `__test__/model/round.playing.test.ts` (34 tests)

Purpose: Verify state changes for plays and draws, special-card effects, draw-pile recycling, boundary errors, and one explicit two-player rule.

Public API touched: `Round.play`, `canPlay`, `canPlayAny`, `draw`, `playerHand`, `playerInTurn`, `drawPile`, and `discardPile`; pile `size`, `top`, `peek`, and `deal`; adapters `createRound` and `createRoundFromMemento`.

Important behavior:

- Illegal `play` calls throw; valid play removes the indexed card, returns it, and puts it on top of the discard pile.
- Numbered play advances one player and sets current color to the card's color.
- `SKIP` advances past the next player.
- `REVERSE` changes direction persistently.
- `DRAW` gives the next player two cards and skips that player.
- `WILD` requires a color argument, changes current color, and advances normally.
- `WILD DRAW` requires a color, gives the next player four cards, and skips that player.
- Passing a chosen color for a colored card throws; omitting it for either wild type throws.
- `canPlayAny()` evaluates the current hand.
- `draw()` appends the top draw-pile card to the hand. An unplayable draw ends the turn; a playable draw leaves the same player in turn so it may be played.
- When a draw empties the draw pile, all but the top discard are shuffled into a new draw pile immediately.
- Penalty draws also recycle the discard pile when necessary.
- With two players, playing `REVERSE` returns the turn to the same player, acting like `SKIP`.

Implementation priority: Must-have Round gameplay.

Notes / ambiguities: One test title says an “unplayable” draw does not advance, but its fixture draws a playable same-color card; the assertion and fixture agree with the rules, so the title is treated as a typo. The suite does not directly test voluntary drawing when another card is playable, restricting a post-draw play to only the drawn card, ordinary two-player Skip, two-player draw cards, or return values from `draw()`.

## UNO declaration, round ending, and scoring

Test file: `__test__/model/round.going.out.test.ts` (41 tests)

Purpose: Verify the catch window and penalty for a missed UNO declaration, round terminal behavior, score calculation, and round-end callbacks.

Public API touched: `Round.sayUno(playerIndex)`, `catchUnoFailure({accuser, accused})`, `play`, `draw`, `playerHand`, `drawPile`, `discardPile`, `hasEnded`, `winner`, `playerInTurn`, `canPlay`, `canPlayAny`, `score`, and `onEnd(callback)`.

Important behavior:

- A catch succeeds only after the accused has played down to one card without an effective UNO declaration.
- Any tested accuser may catch the exposed player.
- A successful catch adds four cards to the accused hand and consumes four draw-pile cards, recycling when needed.
- An incorrect accusation returns `false` and does not consume the real catch opportunity.
- A successful accusation cannot be applied twice.
- Saying UNO before the penultimate play protects the player; saying it after the play but before accusation also protects them (self-catch).
- A premature declaration is not durable across intervening player actions.
- The catch opportunity expires when the next player plays or draws.
- `sayUno` and the accused index reject negative/out-of-range values. Accuser bounds are not tested.
- A round ends immediately when a hand becomes empty. The winner is its player index, `playerInTurn()` becomes `undefined`, predicates return `false`, and later `play`, `draw`, or `sayUno` calls throw.
- `score()` is `undefined` before the round ends and then totals all opponents' remaining cards: numbered face value; action cards 20; wild cards 50.
- A final `DRAW` still gives the next player two cards before scoring, and those cards count.
- Every registered `onEnd` callback fires once with `{winner: playerIndex}`.

Implementation priority: UNO is Should-have; basic round ending/scoring behavior supports the tested model, while full-game scoring is Could-have under the specification.

Notes / ambiguities: Incorrect-timing UNO calls have no tested return value or penalty. Catching oneself through `catchUnoFailure`, accuser bounds, serializing outstanding UNO windows, and a final `WILD DRAW` are not directly tested. Callback return/unsubscribe behavior and callback error handling are unspecified.

## Round mementos

Test file: `__test__/model/round.memento.test.ts` (23 tests)

Purpose: Fix the observable serialized Round shape, restoration behavior, ordering, direction encoding, and selected consistency checks.

Public API touched: adapter `createRoundFromMemento`; `Round.toMemento` and the ordinary Round/pile accessors used to observe restored state.

Important behavior:

- Confirmed fields are `players`, `hands`, `drawPile`, `discardPile`, `currentColor`, `currentDirection`, `dealer`, and `playerInTurn`.
- Players are strings; hands and piles are arrays of card mementos; their array order is preserved.
- The first discard-pile element is its top.
- Direction literals are lowercase `clockwise` and `counterclockwise`.
- Player count is derived from hands/players.
- An unfinished round requires `playerInTurn`; a finished round with exactly one empty hand may omit it.
- Restoration rejects a players/hands count mismatch, fewer than two players, two empty hands, an empty discard pile, invalid current color, a colored top discard inconsistent with current color, and invalid dealer/player-in-turn indexes.
- `toMemento()` must deeply equal the input shape for tested valid mementos.

Implementation priority: Could-have by the specification, but high practical priority because many complex tests use restoration fixtures and later assignments need serialization.

Notes / ambiguities: Maximum player count on restoration, direction validation beyond the two valid examples, wild top/current-color consistency, duplicate players, malformed pile cards, exactly one empty hand with a defined turn, and extra fields are untested. The shape has no serialized UNO-declaration/catch-window state.

## Full Game

Test file: `__test__/model/uno.test.ts` (26 tests)

Purpose: Verify multi-round orchestration, defaults, scoring, random initial dealer selection, automatic next rounds, and game completion.

Public API touched: adapters `createGame(Partial<GameConfig>)` and `createGameFromMemento`; exports `Game` and `GameMemento` from `src/model/uno`; `Game.playerCount`, `targetScore`, `player`, `score`, `winner`, and `currentRound`.

Important behavior:

- Defaults are players `A` and `B` and target score 500.
- A game rejects fewer than two players and non-positive target score.
- Scores start at zero and no winner exists initially.
- An initial round starts immediately; repeated `currentRound()` calls return the same instance until it ends.
- An injected `Randomizer(bound)` selects the initial dealer.
- When a round ends, its score is added to its winner's cumulative score and a new round starts unless that score reaches/exceeds the target.
- At game end `winner()` is the winning player index and `currentRound()` is `undefined`.

Implementation priority: Could-have. The written specification explicitly makes full `Game` optional even though tests exist.

Notes / ambiguities: Dealer selection/rotation for later rounds, player maximum, duplicate names, bounds for `score(index)`, target-score numeric constraints beyond positive, events, and public constructors are not tested.

## Game mementos

Test file: `__test__/model/uno.memento.test.ts` (17 tests)

Purpose: Verify the serialized Game shape, restoration, live Round callback integration, validation, and exact round-trip output.

Public API touched: adapter `createGameFromMemento`; `Game.currentRound`, `player`, `targetScore`, `score`, `winner`, and `toMemento`.

Important behavior:

- Confirmed fields are `players`, optional `currentRound`, `targetScore`, `scores`, and `cardsPerPlayer`.
- Scores are a positional number array aligned with players.
- An unfinished game has exactly one current round; a finished game omits it and is inferred from a score meeting/exceeding the target.
- A restored game observes the restored round ending and updates itself.
- Restoration rejects fewer than two players, non-positive target, negative scores, player/score count mismatch, multiple winners, and a missing round for an unfinished game.
- `toMemento()` deeply equals the supplied valid unfinished or finished shape.

Implementation priority: Could-have with full Game.

Notes / ambiguities: A test intended to assert no round uses `toBeUndefined` without invoking it; the surrounding shape and other tests still establish the intended behavior. Validation of an unexpected current round in a finished game, cards-per-player bounds, nested player mismatch, and exact winner tie semantics beyond multiple target-reaching scores are untested.

## Utility and adapter files

Test file: `__test__/utils/test_adapter.ts`

Purpose: Provide implementation-independent construction seams.

Public API touched: `createInitialDeck`, `createDeckFromMemento`, `createRound`, `createRoundFromMemento`, `createGame`, and `createGameFromMemento`; configuration types `HandConfig` and `GameConfig`.

Important behavior: Round defaults are an injected standard shuffler and seven cards per player. Game construction accepts partial configuration and therefore requires adapter defaults. Restoration accepts injectable shuffler/randomizer dependencies.

Implementation priority: Required test integration, but not production domain behavior.

Notes / ambiguities: `Card`, `Deck`, `Round`, and `Game` are deliberately `any` placeholders, and all adapter bodies are empty. The adapter fixes construction capabilities, not production constructor names.

Test file: `__test__/utils/predicates.ts`

Purpose: Match structural cards by optional type, color, and number constraints.

Public API touched: direct imports of `Card`, `Color`, and `Type`.

Important behavior: Numbered cards expose `type`, `color`, and `number`; colored action cards expose `type` and `color`; wild cards expose only their type in tested mementos.

Implementation priority: Compile-time prerequisite for card/deck tests.

Notes / ambiguities: This helper does not validate cards and deliberately ignores `color`/`number` for wild types.

Test file: `__test__/utils/shuffling.ts`

Purpose: Build deterministic card orders and observe shuffling while remaining implementation-independent.

Public API touched: direct imports of `Card` and `Round`, and the `createRound` adapter.

Important behavior: A `Shuffler<Card>` mutates an array in place. Fixture indexes establish index 0 as the next card and establish contiguous per-player dealing.

Implementation priority: Test-fixture infrastructure.

Notes / ambiguities: The production model need not copy the helper's builder architecture.
