# Canonical architecture

Status: **Accepted and binding.**

[ADR 0014](adr/0014-portfolio-product-reset.md) reset the product from a
single agent-governance replay lab to a bilingual portfolio built around the
five-item **Five Decisions** collection — Prism, Relay, Limen, Axiom, and
Vector. This document describes the resulting target shape at a high level.
Sections describing retired machinery are marked **Superseded** in place,
pointing at ADR 0014, rather than deleted — the prior demo existed and its
record matters for later readers, even where its code does not ship as the
flagship surface anymore.

## 1. Binding decisions

- Astro in `output: "static"` mode, written in TypeScript, on a **Vercel**
  adapter. Every route is a prerendered physical file except exactly one:
  `apps/site/src/pages/api/ask.ts`, which sets `prerender = false`.
- The repository is a **pnpm workspace** on a pinned Node.js LTS release.
- Preact hydrates at most **two islands**: an interactive map connecting
  Data, Applied AI, Systems, Product, and Learning to the five decisions,
  and the Ask Diego guide. No other route ships framework JavaScript.
- Bilingual (English/Spanish) route parity for essential content.
- Versioned JSON Schema remains the cross-boundary contract for manifests;
  **Vitest** runs unit/contract/integration tests and **Playwright** plus
  axe-core runs static-host browser and accessibility checks.
- ESLint flat config, Prettier, and `opa fmt` (while Rego source remains in
  the tree) keep formatting/linting consistent.
- No database, queue, CMS, analytics service, or general-purpose task
  runner. Only the integration owner edits package manifests and the
  lockfile.
- The computational-editorial visual system is decided by `DESIGN.md` and
  [ADR 0015](adr/0015-computational-editorial-visual-system.md): Big
  Shoulders Display, Public Sans, and Martian Mono; Field, Graphite, Survey,
  and Signal color roles; and a woven, differentiated bipartite capability
  map.
- No product name is selected.

**Superseded by [ADR 0014](adr/0014-portfolio-product-reset.md):** the
GitHub-Pages-only deployment target ([ADR 0004](adr/0004-root-github-pages-deployment.md));
the `RunBundle`/Replay contract and its Rego/Merkle evidence machinery as the
flagship public surface ([ADR 0006](adr/0006-runbundle-and-replay.md),
[ADR 0007](adr/0007-rego-execution.md), [ADR 0010](adr/0010-merkle-evidence-semantics.md));
the Fake/Replay/Live provider seam ([ADR 0008](adr/0008-provider-and-live-runtime.md));
literal/mirror-only CV rendering ([ADR 0005](adr/0005-canonical-cv-rendering.md));
and Brutalist Editorial / Editorial Evidence Ledger
([ADR 0013](adr/0013-brutalist-editorial.md), [ADR 0012](adr/0012-editorial-evidence-ledger.md)).
Astro, TypeScript, pnpm, and Preact themselves are **not** superseded — see
[ADR 0002](adr/0002-static-site-stack.md) and
[ADR 0003](adr/0003-language-and-tooling.md), which this document extends
rather than replaces.

## 2. System shape

There is one deployable: the Astro site on Vercel, almost entirely
prerendered static output plus one serverless function for `/api/ask`.

```text
content/source/cv.yaml (read-only)
  -> strict résumé loader + source-path provenance
  -> cv:sync (manual, read-only against the separate CV repository)
  -> Astro pages (EN + ES)
  -> static portfolio, Five Decisions collection, and résumé companion

portfolio.project.json manifests (per decision, validated + locked)
  -> decisions-registry loader
  -> Five Decisions pages + interactive map

closed bilingual corpus (bio, projects, credentials, education, FAQ)
  -> ask-corpus loader + deterministic retrieval
  -> POST /api/ask (server-only; provider optional, off by default)
  -> Ask Diego island, with a static-FAQ fallback when no provider answers
```

**Superseded:** the earlier two-deployable model — a GitHub Pages static
artifact plus an independent optional Fastify runtime container
([ADR 0008](adr/0008-provider-and-live-runtime.md)) — is retired. `apps/runtime`
was always documentation, never implemented, so no running service required
decommissioning.

### Static/dynamic ownership

The static output owns all portfolio, résumé-companion, and Five Decisions
HTML/CSS, the decisions-registry manifests and lock file, the closed Ask
Diego corpus content, and every browser-safe script for the two Preact
islands. `/api/ask` alone owns the optional provider key, the live request to
that provider, and rate-limiting/fallback logic. Its unavailability affects
only the Ask Diego island; every other route keeps working.

## 3. Repository and module boundaries

```text
/
├── apps/
│   └── site/
│       ├── public/
│       └── src/
│           ├── pages/                 # EN routes; pages/es/ for Spanish
│           │   └── api/ask.ts         # the one dynamic route
│           ├── layouts/
│           ├── components/
│           ├── features/map/          # Preact island
│           ├── features/ask-diego/    # Preact island
│           └── styles/
├── packages/
│   ├── resume/            # cv.yaml validation, view model, cv:sync consumer
│   ├── decisions/         # portfolio.project.json schema, loader, registry
│   └── ask-corpus/         # forthcoming — see below
├── content/
│   ├── source/cv.yaml     # read-only canonical fact
│   ├── decisions/         # Five Decisions manifests (portfolio.project.json)
│   ├── site/               # bilingual EN/ES content (hero, map, about, ...)
│   └── public-sources/    # public-spec provenance ledger
├── tools/
│   ├── cv-sync/
│   └── check-vercel-output/
├── tests/
└── .github/workflows/
```

Import direction philosophy is unchanged from the original architecture:
`apps/site` imports only browser-safe code; generated JSON is validated both
when produced and when consumed; only the integration owner edits package
manifests and the lockfile.

**Retired:** `packages/contracts`, `packages/replay`, `packages/testkit`,
`policies/**`, the Replay Preact island, `tools/build-replays`, and
`tools/opa` are deleted, and the `/lab/replay/` page is gone. As ADR 0014
required, the coordinated retirement workstream re-ran the consumer search
first and confirmed no remaining live consumer — import, script, test, or CI
reference — before deleting any of it. `/lab/replay/` and `/lab/replay` still
resolve, now only as a permanent redirect to `/work/governance-lab/`
(section 4), and `packages/decisions` (above) exists in their place.
`apps/runtime`, `packages/governance-core`, `packages/policy-runtime`, and
`packages/providers` were always documentation-only and never implemented,
so their removal from this document required no code cleanup.

**Landed:** the small `packages/decisions` package owns the versioned
`portfolio.project.json` JSON Schema, a strict loader/validator, and the
canonical JSON + SHA-256 lock file `tools/build-decisions` writes under
`apps/site/public/decisions/v1/`, consumed by the Five Decisions pages and
the map once they land.

**Landed:** the small `packages/ask-corpus` package owns the closed
bilingual corpus's versioned JSON Schema, a strict loader/validator, a
deterministic TF-IDF token-overlap search (no ML dependency, no network),
and the canonical JSON + SHA-256 lock file `tools/build-corpus` writes
under `apps/site/public/corpus/v1/**`, plus a statically-imported
`generated/corpus-bundle.json` snapshot so the deployed `/api/ask` function
needs no filesystem access at request time. `apps/site/src/lib/ask-diego/**`
owns the request/response contract, the injectable in-memory rate limiter,
and the provider-optional, Preview-only Groq transport (Groq's official
OpenAI-Chat-Completions-compatible endpoint, called directly — no
third-party gateway); the `/api/ask` route itself stays a thin wrapper over
both. See
`packages/ask-corpus/README.md` and `.cursor/rules/ai-guide.mdc` for the
concrete API and binding product rules.

## 4. Static site and route model

Every route is a physical file except `/api/ask`. Required routes, English
and Spanish:

- `/` and `/es/` — home: identity, the Five Decisions collection, the map,
  selected work, education/credentials, about, and contact.
- `/work/` and `/es/trabajo/` — the work index; `/work/<decision>/` and
  `/es/trabajo/<decision>/` for each of Prism, Relay, Limen, Axiom, and
  Vector, plus `/work/governance-lab/` and
  `/es/trabajo/laboratorio-de-gobernanza/` for the secondary Personal
  Governance Lab case (the permanent redirect target for the retired
  `/lab/replay/`; its exact slug is a content-workstream detail, not fixed
  here).
- `/resume/` and `/es/cv/` — the résumé companion fed by `cv:sync`.
- `/ask/` and `/es/pregunta/` — the Ask Diego surface, meaningful before
  hydration, with a static FAQ fallback.
- `/404.html` — static recovery page with root-correct links, in the visitor's
  language where determinable.

## 5. Canonical résumé flow (evolved)

`packages/resume` keeps strict `cv.yaml` validation, a typed view model, and
source-path provenance coverage. What changes under ADR 0014: it is no longer
the _only_ permitted rendering path. A new manual `pnpm cv:sync --source
"<path>"` operation reads the separate CV repository read-only, copies the
PDF, produces a preview and public JSON, and writes a manifest recording the
source commit and SHA-256 digest. `/resume/` becomes an **editorial résumé
companion** fed by that manifest — selection, sequencing, and genuinely
creative framing are allowed, exact-string mirroring is not required — while
zero fabrication remains enforced by the fact/narrative boundary in
`AGENTS.md`. `content/source/cv.yaml` itself is never edited by any of this.

## 6. Five Decisions collection

Prism, Relay, Limen, Axiom, and Vector are published from validated
`portfolio.project.json` manifests, not duplicated copy. Prism ships as
`building`, with dates and a real question but no invented evidence; Relay,
Limen, Axiom, and Vector ship as `planned` placeholders. A status is never
upgraded to `verified` without recorded evidence behind it. The manifests
also separate a `learningJourney` (May–August 2026, exam preparation only)
from a `publicBuildJourney` (from August 2026) so that no copy implies a
Five Decisions build existed before that window opens.

## 7. Ask Diego

`/api/ask` is the one dynamic route. It retrieves from the closed
`ask-corpus`, sends only the question, up to four prior messages, and the
retrieved fragments to an optional provider chosen once at the composition
root (configured through `GROQ_MODEL`/`GROQ_API_KEY`, and only ever active
on a Vercel Preview deployment), and returns a short, cited answer. With no
provider configured, on a non-Preview deployment, or on a
`401`/`403`/`429`/`503`/timeout response, it returns `status: "fallback"`
and the site's static FAQ serves the visitor instead — the endpoint
degrades, it never blocks the rest of the
site. See `.cursor/rules/ai-guide.mdc` and `.cursor/rules/security.mdc` for
the binding request/response and secret-handling rules.

## 8. Retired governance/replay product surface — superseded

The original architecture (sections now removed from this document) defined
an elaborate governance domain (`AgentManifest`, `CredentialEnvelope`,
`ToolManifest`, `PolicyDecision`, `ApprovalRequest`, `Run`, `Trace`,
`EvaluationCase`), a versioned `RunBundle` evidence contract with RFC
8785/RFC 6962-style Merkle proofs, Rego policy evaluated by a pinned OPA CLI
with a deferred WebAssembly runtime, and an optional Fastify Live-Groq
runtime behind a Fake/Replay/Live provider seam. All of that is superseded by
[ADR 0014](adr/0014-portfolio-product-reset.md) as the site's flagship public
surface. It is not a claim that agent governance was unsound — only that it
no longer represents the site's primary identity. A coordinated retirement
workstream re-verified live consumers and removed the underlying code
(`packages/contracts`, `packages/replay`, `packages/testkit`, `policies/**`)
separately, as planned; this section remains as the map from the old shape
to the new one. `/lab/replay/` keeps working as a permanent redirect to a
smaller Personal Governance Lab case (section 4) rather than becoming a dead
link.

## 9. Testing determinism

Unchanged in spirit from the original architecture: normal tests and CI are
deterministic, secret-free, and network-free, and never call a live model
provider. The Ask Diego provider is tested through an injected fake HTTP
transport and a fixed synthetic corpus, the same role the Live-Groq fake
transport played before. CV expectations are derived from `content/source/cv.yaml`
at test time rather than snapshotted. Generated manifests, locks, and the
`cv:sync` provenance record are rebuilt and compared, not hand-edited.
`docs/acceptance-criteria.md` and `docs/threat-model.md` define the current
release gates and threat surface in detail.

## 10. Local development and verification

The default workflow needs Node and pnpm through Corepack; no backend or
secret is required for the static build. Root scripts provide stable entry
points for installation, site development, manifest/lock validation,
`cv:sync`, unit/integration/accessibility/E2E tests, the static build, and
artifact checks. Normal tests fail on unexpected network access. CI has no
provider secret; `/api/ask` is exercised in tests only through a fake
transport.
