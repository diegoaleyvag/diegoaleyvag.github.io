# AGENTS.md — Global Invariants

This is a short, principle-based contract, not a rules-tournament narrative.
Read `docs/architecture.md`, `PRODUCT.md`, and the ADRs relevant to your
files before implementation. [ADR 0014](docs/adr/0014-portfolio-product-reset.md)
reset the product; the tournament ADRs it supersedes stay in `docs/adr/` as
historical record only.

## Mission & audience

Build a bilingual (English/Spanish) portfolio for the person identified by
`name` in `content/source/cv.yaml`: a Data Science student and AI systems
builder, targeting **recruiters and engineers** evaluating him for junior
AI/ML/Data roles. The site's design and narrative voice are themselves the
product, not a wrapper around a résumé — see `PRODUCT.md`.

## Facts vs. narrative — the invariant that matters most

`content/source/cv.yaml` remains the sole authority for every underlying
fact: employers, dates, degree, certifications, project names. **No new
fact, metric, employer, user count, model result, or date may ever be
invented anywhere on the site** — in copy, code, comments, fixtures, or the
Ask Diego corpus.

Within that boundary, narrative framing, structure, sequencing, and Spanish
translation may be **genuinely creative and editorial** — never a mechanical
mirror of the YAML strings. Creative license changes *how* a fact is told,
never *what* the fact is: reordering, editorial framing, and faithful
paraphrase are allowed; a number, date, name, employer, or outcome that does
not trace to `cv.yaml` or an approved `content/public-sources/` entry is not.

Every project/case (Five Decisions and elsewhere) carries a validated status
(`planned`, `building`, `verified`, ...) from a manifest, never freehand
copy. A `planned` or `building` item must look and read as unmistakably
unfinished — never implied as shipped or verified. Publishing the canonical
contact/location fields still requires the owner's reviewed confirmation via
`content/publication-consent.yaml`; no agent or CI input bypasses that gate.

## Clean-room boundary

Never reuse, paraphrase, or infer proprietary Infosys "Agent Governance
Framework" code, architecture, or internal documentation. Only public
concepts referenced in the CV — W3C DIDs/VCs, OPA/Rego, Merkle audit trees,
OpenTelemetry — may ever be reimplemented, only from public specifications,
cited under `content/public-sources/`. If provenance is uncertain, omit the
feature.

## Synthetic data and secrets

All demo, scenario, fixture, trace, telemetry, and test data is
unmistakably synthetic, forever; no real visitor-submitted input is stored
or logged anywhere. The canonical CV is the only personal-content exception —
its fields render on portfolio/résumé routes only, never copied into
fixtures, telemetry, logs, or analytics.

No API key or model-provider credential ever reaches the browser, a client
bundle, or any `PUBLIC_*`/`NEXT_PUBLIC_*`-style variable. Keys live only in
server-side environment variables; `.env.example` ships placeholders only. The
static build reads no secret and succeeds with no `.env`.

## Architecture: static output, one dynamic endpoint

Astro builds in `output: "static"` mode. Every route is a prerendered
physical file except exactly one, `apps/site/src/pages/api/ask.ts`, which
sets `prerender = false` and runs through a Vercel adapter. No other route
becomes dynamic without a superseding ADR. Preact hydrates at most two
islands — an interactive map and the Ask Diego guide; everything else ships
no client framework JavaScript. No visual direction is chosen yet — follow
`DESIGN.md`'s fixed constraints until a best-of-N exploration and ADR 0015
finalize typography, color, and the hero/map composition.

## Ask Diego: provider-optional, closed, degradable

Ask Diego answers only from a closed, bilingual corpus built from approved
content, with a citation on every answer. It is network-free and off by
default in tests; a provider is chosen once at a single server-side
composition root and caller code never branches on which one is configured.
With no provider configured, or on any upstream failure, the site falls back
to a static FAQ and stays fully useful — an enhancement, never a dependency.
It never calls a tool, browser, filesystem, or private data source, and
never logs a full prompt or response.

## No fabricated photography

No photograph of Diego may ever be AI-generated. Ship a deliberate, honest
placeholder until a real photo is supplied.

## Accessibility, motion, and testing

Target WCAG 2.2 AA on every route, in both languages. Respect real
`prefers-reduced-motion` behavior — no content or task depends on motion to
be understood — and keep essential content usable with JavaScript disabled.
Normal tests are deterministic, network-free, and secret-free; CI never
calls a live model provider. `docs/acceptance-criteria.md` and
`docs/threat-model.md` define the testable release gates and current threat
surface.

## Git workflow

Trunk-based development, short-lived branches, [Conventional
Commits](https://www.conventionalcommits.org/). No force-push to `main`.
Review before integrating. Commits contain **no AI co-author trailers** —
Diego is the sole author of record. Record every notable stack or tooling
decision as an ADR under `docs/adr/`.

## Authority order

1. this file;
2. accepted ADRs under `docs/adr/` (including
   [ADR 0014](docs/adr/0014-portfolio-product-reset.md));
3. `docs/architecture.md`;
4. `PRODUCT.md` and `DESIGN.md`;
5. scoped `.cursor/rules/*.mdc`.

Do not reopen an accepted decision during implementation. Propose a
superseding ADR when evidence shows a material need. No product name has
been selected.
