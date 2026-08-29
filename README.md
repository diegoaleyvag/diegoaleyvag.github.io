# diegoaleyvag

This repository hosts a bilingual (English/Spanish) personal portfolio for a
Data Science student and AI systems builder, an editorial résumé companion
generated from `content/source/cv.yaml`, a five-item public collection of
real questions turned into runnable evidence (Prism, Relay, Limen, Axiom,
Vector), and an optional, provider-neutral "Ask Diego" endpoint.

## Product status

**Reset.** [ADR 0014](docs/adr/0014-portfolio-product-reset.md) moved the
product from a single agent-governance replay lab to the bilingual Five
Decisions portfolio described above. The accepted architecture is Astro
static output plus a Vercel adapter, TypeScript, pnpm, and at most two Preact
islands (an interactive map and Ask Diego) — with exactly one dynamic route,
`/api/ask`. The concrete computational-editorial visual system is decided in
`DESIGN.md` and ADR 0015.

Earlier tournament records (the original proposals, blind judgements, and
the ADRs ADR 0014 supersedes) remain in `docs/adr/` and git history as
historical inputs; they are no longer active implementation instructions.

## How to navigate

- `AGENTS.md` — global invariants and implementation conventions.
- `PRODUCT.md` — brand register: audience, positioning, and voice.
- `DESIGN.md` — decided visual system and accessibility constraints.
- `docs/architecture.md` — binding stack, boundaries, and route model.
- `docs/threat-model.md` — assets, boundaries, threats, and controls.
- `docs/acceptance-criteria.md` — testable release gates for the reset.
- `docs/adr/` — accepted architecture decisions, including
  [ADR 0014](docs/adr/0014-portfolio-product-reset.md).
- `content/source/cv.yaml` — canonical, read-only CV facts.
- `.cursor/rules/` — always-on safety plus file-scoped implementation rules.
- `.env.example` — placeholder environment variables only.

Changes follow short-lived branches, Conventional Commits, and review before
integration.
