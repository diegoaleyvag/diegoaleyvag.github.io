# diegoaleyvag

This repository will host a personal portfolio, an HTML résumé generated from
`content/source/cv.yaml`, a clean-room agent-governance and reliability project,
a static-first Replay demo, and an optional provider-neutral runtime with Groq
as the first Live provider.

## Tournament status

**Synthesis is complete.** Candidate A was selected as the base after blind
judging, with a reduced first-night scope and specific compatible decisions from
the other proposals. The accepted architecture is Astro static output,
TypeScript, an isolated Preact Replay island, pnpm, and an optional stateless
Fastify runtime. No application source has been written yet.

Completed phases:

1. Bootstrap — invariants, constraints, and evaluation rubric.
2. Proposals — three independent designs in `docs/proposals/`.
3. Judgements — two blind scoring records in `docs/judgements/`.
4. Synthesis — canonical plan and accepted decisions in `docs/` and
   `docs/adr/`.

Next is the build phase, starting with the vertical slice in
`docs/acceptance-criteria.md`.

## How to navigate

- `AGENTS.md` — global invariants and implementation conventions.
- `docs/architecture.md` — binding stack, boundaries, data flow, and hard
  question resolutions.
- `docs/product-brief.md` and `docs/portfolio-narrative.md` — product and
  source-grounded content direction.
- `docs/design-direction.md` — the one accepted visual direction.
- `docs/threat-model.md` — assets, boundaries, threats, and controls.
- `docs/acceptance-criteria.md` — testable first-slice and later gates.
- `docs/task-graph.md` — parallel ownership and dependency DAG.
- `docs/adr/` — accepted architecture decisions.
- `docs/proposals/` and `docs/judgements/` — historical tournament inputs.
- `docs/hard-constraints.md` — non-negotiable implementation checklist.
- `content/source/cv.yaml` — canonical, read-only CV facts.
- `.cursor/rules/` — always-on safety plus file-scoped implementation rules.
- `.env.example` — placeholder environment variables only.

Changes follow short-lived branches, Conventional Commits, and review before
integration.
