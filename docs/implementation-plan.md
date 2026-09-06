# Implementation Plan

This roadmap stays intentionally high-level until each original specification and supplied test suite has been inspected.

| Phase | Primary learning goal | Main technology | Inherited input | Must remain isolated | Output for later work |
|---|---|---|---|---|---|
| Phase 0 – repository/domain contract | Establish consistent structure, vocabulary, and boundaries | Markdown and repository conventions | Semester brief | No game implementation or framework boilerplate | Stable conceptual contract and independent snapshot directories |
| Assignment 1 – OO model | Model UNO behavior with objects and test-driven contracts | TypeScript, Jest | Verified Assignment 1 specification and tests | Domain rules from UI, networking, and persistence concerns | OO model and serializable mementos |
| Assignment 2 – Vue + bots | Build a browser application around the OO model and isolate bot work | Vue, Pinia/application state, Web Workers | Assignment 1 OO concepts and implementation | Rules from components, stores, and worker transport | Browser game and serialized worker protocol |
| Assignment 3 – GraphQL multiplayer | Move authority to a multiplayer server | Vue, Apollo Client/Server, GraphQL, persistence | Assignment 2 UI experience and Assignment 1 OO model | Rules from resolvers; secrets from client projections | Authoritative multiplayer API, events, and persistence boundary |
| Assignment 4 – functional rewrite | Express the domain with immutable data and pure functions | TypeScript functional programming | Verified Assignment 1 behavior and concepts | Functional model from OO class wrappers and UI concerns | Independent functional UNO model |
| Assignment 5 – React/Redux/RxJS | Combine functional domain behavior with event-driven multiplayer client state | React, Redux, RxJS, GraphQL | Assignment 3 multiplayer boundaries and Assignment 4 functional model | Rules from React/Redux; streams from domain decisions | React application architecture ready for Next.js adaptation |
| Assignment 6 – Next.js SSR | Apply explicit server/client and rendering boundaries | Next.js, React, Redux/RxJS where client-side | Assignment 5 application and domain boundaries | Domain rules from routes/components; interactive state from server-only code | Final independently runnable Next.js snapshot |

The next planning step is Assignment 1 / Step A1.1: inspect the OO specification and Jest tests to derive the exact public API before implementing it.
