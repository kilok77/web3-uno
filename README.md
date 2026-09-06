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
- [`reference/`](reference/) is reserved for original assignment specifications, UNO rules, and supplied tests.
- [`AGENTS.md`](AGENTS.md) contains repository instructions for future Codex sessions.

## Progress

| Assignment | Topic | Status |
|------------|-------|--------|
| 1 | OO UNO model | In progress — A1.2 complete |
| 2 | Vue + Web Workers | Not started |
| 3 | GraphQL multiplayer | Not started |
| 4 | Functional UNO | Not started |
| 5 | React + Redux + RxJS | Not started |
| 6 | Next.js SSR | Not started |

Current status: repository structure and cross-assignment documentation initialized; Assignment 1 card/type foundations are implemented through A1.2.
