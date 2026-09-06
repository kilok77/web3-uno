# Cross-Assignment Domain Contract

This document establishes stable language and conceptual boundaries for the semester. It is an architectural contract, not the exact Assignment 1 public API.

Three levels must remain distinct:

1. **Stable terminology** is vocabulary that later assignments should keep consistent.
2. **Conceptual serialized shapes** illustrate plain-data boundaries and may be refined after inspecting supplied materials.
3. **Assignment-specific implementations** may use classes, immutable records, functions, GraphQL types, or framework state appropriate to that assignment.

The original assignment specification and supplied tests are authoritative. If they conflict with an example here, adapt the concrete implementation and document the difference instead of changing tests. Do not change shared terminology silently.

## Stable terminology

### Cards

Use the American spelling `color` exclusively.

```ts
type Color =
  | "RED"
  | "GREEN"
  | "BLUE"
  | "YELLOW";

type CardType =
  | "NUMBERED"
  | "SKIP"
  | "REVERSE"
  | "DRAW"
  | "WILD"
  | "WILD DRAW";
```

These names describe the standard UNO card concepts. Do not arbitrarily rename `DRAW` or `WILD DRAW` to `DRAW_TWO`, `WILD_DRAW_FOUR`, `WILD_DRAW_4`, or similar variants. A different public representation is permitted only when verified supplied tests or specifications require it; record that adaptation in the relevant assignment notes.

The precise fields, values, and behavior of each card type remain subject to Assignment 1 specification and test inspection.

### Direction

```ts
type Direction = "CLOCKWISE" | "COUNTERCLOCKWISE";
```

This is the stable conceptual representation. A concrete implementation may adapt it if supplied tests require another public form.

### Identity

```ts
type PlayerId = string;
type GameId = string;
```

A `PlayerId` is a stable identity. A `displayName` is presentation data and is not identity: names may collide or change, while commands, ownership, authorization, reconnects, and multiplayer state need an unambiguous player reference.

## Mementos: the serialization boundary

A memento is plain serialized state used at architectural boundaries:

```text
OO model
   ↓
Memento / serializable state
   ├── tests
   ├── Web Workers
   ├── GraphQL
   ├── persistence
   ├── functional model
   ├── Redux
   └── Next.js
```

Mementos must:

- contain plain JavaScript data and no methods;
- be JSON-compatible;
- contain no class instances;
- be transferable through `postMessage`;
- be storable in persistence;
- be transferable through APIs.

This JSON vocabulary is useful when checking a candidate shape:

```ts
type JsonPrimitive = string | number | boolean | null;
type JsonValue =
  | JsonPrimitive
  | { readonly [key: string]: JsonValue }
  | readonly JsonValue[];
```

The following interfaces are deliberately conceptual. Optional fields enumerate likely state without promising the exact Assignment 1 field names, requiredness, collection forms, or encodings.

```ts
interface CardMemento {
  type: CardType;
  color?: Color;
  number?: number;
}

interface RoundMemento {
  players?: readonly JsonValue[];
  hands?: Readonly<Record<PlayerId, readonly CardMemento[]>>;
  drawPile?: readonly CardMemento[];
  discardPile?: readonly CardMemento[];
  dealer?: PlayerId;
  playerInTurn?: PlayerId;
  direction?: Direction;
  currentColor?: Color;
  unoState?: JsonValue;
  status?: string;
}

interface GameMemento {
  gameId?: GameId;
  players?: readonly JsonValue[];
  scores?: Readonly<Record<PlayerId, number>>;
  currentRound?: RoundMemento;
  targetScore?: number;
  status?: string;
  winner?: PlayerId;
}
```

The concepts likely required in round state are players, hands, draw pile, discard pile, dealer, player in turn, direction, current color, UNO-related state, and round status. Game state likely includes players, scores, current round, target score, game status, and winner. All remain provisional until Assignment 1 tests and specification establish the exact public model API.

Mementos describe state, not domain behavior. Each assignment may construct and consume them differently, but crossing a worker, network, persistence, or framework boundary must not leak live domain objects.

## Command vocabulary

Commands express player intent. Their stable discriminants are:

```text
PLAY_CARD
DRAW_CARD
SAY_UNO
CATCH_UNO
```

Conceptual examples:

```ts
type PlayCardCommand = {
  type: "PLAY_CARD";
  gameId: GameId;
  playerId: PlayerId;
  cardIndex: number;
  color?: Color;
};

type DrawCardCommand = {
  type: "DRAW_CARD";
  gameId: GameId;
  playerId: PlayerId;
};

type SayUnoCommand = {
  type: "SAY_UNO";
  gameId: GameId;
  playerId: PlayerId;
};

type CatchUnoCommand = {
  type: "CATCH_UNO";
  gameId: GameId;
  playerId: PlayerId;
  targetPlayerId?: PlayerId;
};
```

Vue, workers, GraphQL, React, Redux, and Next.js can use this common language without owning the rules that decide whether a command is legal. Payload details such as card identity versus index and whether catching UNO needs an explicit target are not frozen; Assignment 1–3 requirements may justify a better structure.

## Event vocabulary

The stable update event is `GAME_UPDATED`:

```ts
type GameUpdatedEvent = {
  type: "GAME_UPDATED";
  gameId: GameId;
  // A serialized authoritative state or viewer-specific projection.
  game: GameMemento | PlayerGameView;
};
```

Its conceptual role is:

```text
server mutation
      ↓
domain changes
      ↓
GAME_UPDATED
      ↓
GraphQL subscription
      ↓
RxJS
      ↓
Redux
      ↓
React
```

This event and flow are documentation only for now.

## Hidden information and player views

From Assignment 3 onward, raw authoritative game state and state sent to a particular client are not necessarily identical. The server may hold real cards for every hand, while Player A's view contains Player A's cards and only `cardCount` for Player B.

Use the conceptual term `PlayerGameView` for a viewer-specific projection:

```ts
interface PlayerGameView {
  gameId: GameId;
  viewerId: PlayerId;
  // Viewer's visible cards and only permitted information about opponents.
  state: JsonValue;
}
```

Never expose opponents' hidden cards to clients. Projection is an application/server boundary responsibility; UI code must not receive secret state and merely hide it visually. The exact view shape is deferred until the multiplayer requirements are inspected.

## Assignment boundaries

### Assignment 1

An object-oriented TypeScript domain model, verified with Jest, owns UNO rules and exposes serializable mementos. It has no UI or networking.

### Assignment 2

```text
Assignment 1 OO model
        ↓
Vue
Pinia/application state
Web Worker bots
```

Vue components and Pinia must not reimplement UNO rules. Workers communicate with the application through serialized messages only.

### Assignment 3

```text
Vue
Apollo Client
      ↓
GraphQL
      ↓
Apollo Server
      ↓
OO UNO model
      ↓
persistence
```

The server becomes authoritative. Resolvers coordinate application use cases; they do not become a second domain model. Client projections must protect hidden information.

### Assignment 4

Reimplement the same UNO concepts with immutable TypeScript data, pure functions, and functional style. This is a genuine functional model, not a wrapper around Assignment 1 classes.

### Assignment 5

```text
React
Redux
RxJS
GraphQL
functional Assignment 4 model
```

React renders and dispatches intent, Redux holds client application state, and RxJS primarily represents server/event streams. Domain decisions remain in the functional model.

### Assignment 6

Use Next.js Server Components where appropriate and Client Components for interactive game behavior. Keep Redux/RxJS behind client boundaries and make deliberate static, dynamic, and SSR rendering decisions. Next.js routing and rendering code must not absorb UNO rules.
