# WEB3 Repository Instructions

These instructions apply to the entire repository.

## Before implementing an assignment

1. Read this `AGENTS.md`.
2. Read `docs/domain-contract.md`.
3. Read `docs/architecture.md`.
4. Read the relevant `docs/assignment-N.md`.
5. Inspect the original assignment specification and supplied tests.
6. Treat supplied tests and the assignment specification as authoritative when they conflict with the conceptual documentation.

Do not silently change shared terminology. Prefer:

- the American spelling `color` exclusively;
- `PlayerId` for stable player identity, separately from a display name;
- `GameId` for stable game identity;
- plain serialized mementos at process, network, persistence, and framework boundaries.

Before changing a public domain contract:

1. Inspect all usages.
2. Inspect supplied tests and specifications.
3. Explain why the change is necessary.

## Architectural boundaries

Keep UNO domain rules outside:

- Vue components;
- React components;
- Redux;
- Pinia;
- GraphQL resolvers;
- Web Worker transport code;
- Next.js routes and components.

UI and network layers invoke the domain model; they do not duplicate its rules. Transfer state through serializable mementos or viewer-specific projections, and transfer intent through explicit commands.

Never add technology from a future assignment to an earlier snapshot merely because it will eventually be needed.

## Working conventions

- Work on one logical feature at a time.
- Run the relevant tests and report which tests pass or fail.
- Never modify supplied tests merely to make an implementation pass.
- Avoid unrelated refactoring.
- Preserve earlier completed assignment snapshots.
- Keep each assignment independently runnable and hand-in-ready.
- Do not make Assignment N import source through relative paths from another assignment directory unless explicitly requested.
- If reuse is needed, deliberately copy or port the completed implementation so that the hand-in remains independent.
- Do not invent unverified assignment requirements; record uncertainty in the relevant assignment document.
