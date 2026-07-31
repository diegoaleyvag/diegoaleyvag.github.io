# diegoaleyvag

This repository is being bootstrapped through an **internal architecture tournament**
before any production code is written. It will eventually host Diego Alejandro Leyva
García's personal portfolio, an HTML resume generated from `content/source/cv.yaml`,
a clean-room "agent governance & reliability" project, a static-first interactive
demo (Replay mode), and an optional, provider-neutral live-inference runtime
(Groq first).

## Tournament status

**Phase 1 — Bootstrap: complete (this commit).** Only invariants, constraints, and a
scoring rubric exist. No framework, language, package manager, database, product
name, visual design, or repository architecture has been chosen yet.

| Phase | What happens | Where it lands |
| --- | --- | --- |
| 1. Bootstrap | Invariants, hard constraints, rubric — no code | this commit |
| 2. Proposals | Independent architects submit competing designs | `docs/proposals/` |
| 3. Judgements | Judges blind-score each proposal against the rubric | `docs/judgements/` |
| 4. Synthesis | A synthesizer picks/merges the winning approach | `docs/adr/` |
| 5. Build | Implementation begins, following the chosen architecture | (future) |

## How to navigate

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Global invariants every agent/architect must follow |
| `docs/project-context.md` | Mission, audience, goals, non-goals |
| `docs/hard-constraints.md` | Non-negotiable checklist for architects |
| `docs/evaluation-rubric.md` | 0–100 scoring rubric used by judges |
| `docs/proposals/` | Competing architecture proposals (empty until Phase 2) |
| `docs/judgements/` | Judge scoring notes (empty until Phase 3) |
| `docs/adr/` | Architecture Decision Records (empty until Phase 4) |
| `content/source/cv.yaml` | Canonical, read-only CV facts |
| `.env.example` | Placeholder environment variables (no real secrets) |

Diego is the sole author of this repository and will publish it manually after
reviewing the bootstrap commit.
