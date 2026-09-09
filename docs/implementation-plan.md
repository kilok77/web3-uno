# Implementation Plan

The six-phase roadmap is now implemented. Each assignment remains an independent runnable snapshot rather than importing source from a sibling assignment.

| Phase | Primary learning goal | Main technology | Inherited input | Must remain isolated | Output |
|---|---|---|---|---|---|
| Phase 0 – repository/domain contract | Establish consistent structure, vocabulary, and boundaries | Markdown and repository conventions | Semester brief | Game implementation from framework concerns | Stable conceptual contract and independent snapshot directories |
| Assignment 1 – OO model | Model UNO behavior with objects and test-driven contracts | TypeScript, Jest | Verified Assignment 1 specification and tests | Domain rules from UI/networking | Complete OO model and mementos |
| Assignment 2 – Vue + bots | Build a browser application and isolate bot work | Vue, Web Workers | Assignment 1 | Rules from components and worker transport | Complete browser game |
| Assignment 3 – GraphQL multiplayer | Move authority to a multiplayer server | Vue, Apollo, GraphQL, persistence | Assignment 2 + OO model | Rules from resolvers; hidden hands from clients | Complete authoritative multiplayer snapshot |
| Assignment 4 – functional rewrite | Express the domain with immutable data and pure functions | Functional TypeScript | Assignment 1 behavior | Functional model from OO wrappers/UI | Complete functional UNO model |
| Assignment 5 – React/Redux/RxJS | Combine functional behavior with event-driven multiplayer state | React, Redux, RxJS, GraphQL | Assignment 3 + Assignment 4 | Rules from React/Redux | Complete React multiplayer snapshot |
| Assignment 6 – Next.js SSR | Apply explicit server/client and rendering boundaries | Next.js, React, Redux/RxJS | Assignment 5 | Domain rules from routes/components | Complete final Next.js snapshot |

CI verifies all six snapshots independently.
