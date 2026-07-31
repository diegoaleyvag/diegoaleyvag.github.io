# AGENTS.md — Global Invariants

These invariants apply to every agent, architect, and judge working in this
repository, for the entire tournament and everything built after it. They are
non-negotiable unless Diego explicitly amends this file.

## Mission & audience

Build a distinctive personal portfolio, a generated HTML resume, a clean-room
agent-governance & reliability project, and a static-first interactive demo for
**Diego Alejandro Leyva García**, targeting **recruiters and engineers**
evaluating him for junior AI/ML engineering roles.

## Canonical source of truth

`content/source/cv.yaml` is **read-only, canonical fact**. Never rewrite, correct,
embellish, infer, or extrapolate from it. Never fabricate experience, metrics, or
integrations that are not present in it.

## Clean-room requirement

No reuse, paraphrase, or inference of proprietary Infosys code, architecture,
internal documentation, or IP. Reimplement only **public** concepts referenced in
the CV — W3C DIDs/VCs, OPA/Rego, Merkle audit trees, OpenTelemetry — from public
specifications and public documentation only.

## Synthetic data only

No real PII, patient data, or proprietary datasets anywhere in the repo, demos,
fixtures, or tests. All example data must be synthetic.

## Secrets

No API key may ever reach the browser, a client bundle, or any `NEXT_PUBLIC_*`-style
(or equivalent client-exposed) variable. Keys live only in local or server-side
environment variables. `.env.example` ships with placeholders only; a real `.env`
is never committed.

## Static-first

The public web build MUST be a fully static bundle, deployable to GitHub Pages at
the domain root (`diegoaleyvag.github.io`, no basePath). **Replay mode** must work
with zero backend.

## Provider-neutral runtime

The optional live-inference runtime supports exactly three interchangeable
providers behind one interface:

- **Fake** — deterministic, for tests.
- **Replay** — reads stored JSON runs; powers the zero-backend demo.
- **Live** — Groq, OpenAI-compatible API (first and currently only live provider).

Read Groq rate limits from response headers at runtime; never hardcode them.

## Tooling

Prefer modern, fast tooling where justified (e.g. `uv` for Python virtual
environments/dependencies, if a Python service is chosen). Every notable
stack or tooling choice must be recorded as an ADR in `docs/adr/`.

## Git workflow

Trunk-based development, short-lived branches, [Conventional
Commits](https://www.conventionalcommits.org/). No force-push to `main`. Review
before integrating. Commits must **not** include AI co-author trailers — Diego is
the sole author of record.

## Definition of Done

- Tests pass locally before a task is marked complete.
- Agents touch only the files/areas they own.
- No invented metrics, experience, or integrations — ever.

## Tournament boundaries

Bootstrap decides no stack, name, or architecture. Architects propose
independently in `docs/proposals/`. Judges score blind against
`docs/evaluation-rubric.md` in `docs/judgements/`. A synthesizer makes the final
call, recorded as an ADR in `docs/adr/`.
