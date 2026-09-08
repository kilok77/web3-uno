# WEB3 UNO Semester Project

This repository holds six independently runnable, hand-in-ready snapshots of an evolving UNO project for the WEB3 semester.

The project begins with an object-oriented TypeScript domain model. That model is used by a browser-only Vue application and then by a GraphQL multiplayer application. A separate functional rewrite branches from the original domain concepts; the multiplayer and functional strands meet in a React/Redux/RxJS application, which later evolves into a Next.js application.

```text
                 ┌── A2 Vue + bots ── A3 Vue + GraphQL multiplayer ──┐
A1 OO model ─────┤                                                     ├── A5 React/Redux/RxJS ── A6 Next.js
                 └── A4 functional model ─────────────────────────────┘
```

## Repository map

- [`assignments/`](assignments/) contains one self-contained snapshot directory per assignment.
- [`docs/architecture.md`](docs/architecture.md) explains the semester-wide architecture.
- [`docs/domain-contract.md`](docs/domain-contract.md) defines shared conceptual terminology and serialization boundaries.
- [`docs/implementation-plan.md`](docs/implementation-plan.md) gives the high-level roadmap.
- [`docs/assignment-1.md`](docs/assignment-1.md) through [`docs/assignment-6.md`](docs/assignment-6.md) track assignment-specific knowledge and status.
- [`reference/`](reference/) contains the original assignment specifications, UNO rules, and supplied tests.
- [`AGENTS.md`](AGENTS.md) contains repository instructions for future coding sessions.

## Progress

| Assignment | Topic | Status |
|------------|-------|--------|
| 1 | OO UNO model | Complete — full supplied suite green |
| 2 | Vue + Web Workers | Complete — typecheck, tests, and production build green |
| 3 | GraphQL multiplayer | Complete — authoritative multiplayer, persistence, subscriptions, tests, and build green |
| 4 | Functional UNO | Complete — typecheck and full supplied functional suite (185/185) green |
| 5 | React + Redux + RxJS | Not started |
| 6 | Next.js SSR | Not started |

Current implementation target: Assignment 5, integrating the A3 multiplayer architecture with the A4 functional model in React, Redux, and RxJS.
