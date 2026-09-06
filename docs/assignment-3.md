# Assignment 3

## Goal

Evolve the Vue application into authoritative GraphQL multiplayer while protecting hidden player information.

## Technologies

Vue, Apollo Client, GraphQL, Apollo Server, and persistence as required by the verified assignment materials.

## Inputs from previous work

The Assignment 2 Vue experience and the Assignment 1 object-oriented domain concepts/model, ported so this submission stays independent.

## Requirements source

The original Assignment 3 specification and supplied tests or supporting material. These have not yet been added or inspected.

## Implementation status

Not started.

## Notes

The server is authoritative. Resolvers invoke application/domain behavior rather than implementing UNO rules, and client state must be a viewer-safe projection.
