# Assignment 2

## Goal

Build a browser-only Vue UNO experience around the Assignment 1 object-oriented model, with bots isolated in Web Workers.

## Technologies

Vue, application state such as Pinia if required, and Web Workers.

## Inputs from previous work

The completed, deliberately ported Assignment 1 OO model and its serializable mementos.

## Requirements source

The original Assignment 2 specification and supplied tests or supporting material. These have not yet been added or inspected.

## Implementation status

Not started.

## Notes

Components, stores, and worker transport must not duplicate UNO rules. Workers exchange serialized messages rather than live domain instances.
