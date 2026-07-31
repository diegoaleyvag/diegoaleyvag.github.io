# Project Context

This document is grounded only in `content/source/cv.yaml` (canonical CV facts)
and the tournament brief that created this repository. It introduces no new
facts, no architecture, and no product name.

## Who this is for

**Diego Alejandro Leyva García** — final-year BSc Data Science student (ESCOM,
Instituto Politécnico Nacional, expected 2027), currently an AI Engineering
Intern at Infosys Limited (InStep Global Internship), seeking junior AI/ML
engineering roles. Full factual detail lives in `content/source/cv.yaml`; this
document does not restate or interpret it further.

## Mission

Give Diego a single, distinctive place on the web where recruiters and engineers
can:

1. Understand who he is and what he has built, via a personal portfolio and an
   HTML resume generated directly from `content/source/cv.yaml`.
2. See credible, hands-on evidence of agent-governance and reliability
   engineering skill, via a clean-room public project that reimplements public
   concepts (W3C DIDs/VCs, OPA/Rego, Merkle audit, OpenTelemetry) rather than
   any proprietary employer IP.
3. Interact with a live demo of that project without needing any backend, API
   key, or account (Replay mode).
4. Optionally go further and exercise the same demo against a real, live LLM
   provider (Groq), when a server-side runtime is deployed and configured.

## Target audience

- **Recruiters / hiring managers** screening quickly: need distinctiveness,
  credibility, and a fast path to "this person can do the job."
- **Engineers** doing deeper technical due diligence: need real architecture,
  real tests, real depth — not decoration.

## Goals

- A portfolio that is memorable and distinctive rather than a generic template.
- A resume that is generated (not hand-maintained) from the single canonical
  source, `content/source/cv.yaml`.
- A public, clean-room demonstration of agent-governance concepts
  (identity/credentials, policy gates, audit evidence, observability) that
  stands on its own technical merit.
- A static, zero-backend "Replay" mode so the demo works forever, for free, for
  any visitor, with no setup.
- An optional, independently-deployable live-inference runtime that is
  provider-neutral by design, with Groq as the first live provider.
- A codebase that is maintainable, tested, and honest about what it is (no
  fabricated metrics or integrations).

## Non-goals

- Reproducing, referencing, or inferring any proprietary Infosys code,
  architecture, internal documentation, or confidential IP. Only public
  specifications for public concepts (DIDs/VCs, OPA/Rego, Merkle trees,
  OpenTelemetry) are in scope.
- Handling real user PII or real (e.g. patient) data anywhere, including in
  demos or tests. All data is synthetic.
- Requiring a backend, database, or API key for the core demo experience to
  work.
- Locking the public site to a specific hosting sub-path — it must serve
  correctly from the GitHub Pages user-root domain, `diegoaleyvag.github.io`.
- Choosing a framework, language, package manager, database, product name,
  visual design, or final repository architecture in this bootstrap step.
  Those are decided by the architecture tournament that follows.
- Adding unnecessary services, vendor lock-in, or complexity beyond what the
  goals above require.

## How this repo gets there

This repository runs an internal architecture tournament before any production
code is written:

1. **Bootstrap** (this commit): invariants (`AGENTS.md`), constraints
   (`docs/hard-constraints.md`), and a scoring rubric
   (`docs/evaluation-rubric.md`).
2. **Proposals**: independent architects submit competing designs into
   `docs/proposals/`.
3. **Judgements**: judges blind-score each proposal against the rubric into
   `docs/judgements/`.
4. **Synthesis**: a synthesizer selects or merges the winning approach and
   records it as an ADR in `docs/adr/`.
5. **Build**: implementation begins only after synthesis, following the chosen
   architecture and the invariants in `AGENTS.md`.
