# Assignment 2

## Goal

Build a browser-only Vue UNO experience around the Assignment 1 object-oriented model, with bots isolated in Web Workers.

## Requirements

### Must have

- Play one round of UNO against 1–3 opponents.
- Bot opponents play according to the implemented UNO rules.
- Bots run as Web Workers and communicate using only `postMessage`/`onmessage`.
- Preserve as much of the official UNO behavior implemented in Assignment 1 as possible.
- Provide a game setup screen and a playing screen.
- Use Vue consistently; this implementation uses Vue 3 Composition API.

### Should have

- Bots sometimes forget to say UNO rather than behaving perfectly every time.
- Bots sometimes catch another player's missed UNO.
- Provide a game-over screen showing the result.

### Could have

- Play an entire multi-round scored game.
- Add a between-rounds screen.

## Implementation

- Vue 3 + Composition API for rendering.
- Pinia for browser application state.
- Assignment 1 OO model copied into `assignments/assignment-2-vue-bots/src/domain/`; no cross-assignment runtime import is used.
- One Web Worker per bot.
- Workers receive serialized `RoundMemento` snapshots and return explicit play/draw decisions.
- Legal-card selection is delegated back to the restored Assignment 1 Round model inside the worker.
- Wild color choice uses the most common intrinsic color in the bot's hand.
- UNO declaration and catching are probabilistic to satisfy the should-have behavior.

## Source

Original specification: `reference/assignments/WEB3 Assignment 2.docx`.

## Status

Implementation added on `chatgpt/assignment-2`; CI verification pending.
