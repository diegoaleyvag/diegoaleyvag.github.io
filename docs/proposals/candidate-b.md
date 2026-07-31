# Architecture Proposal (Candidate B)

> **Thesis:** Diego's portfolio is itself a governed system — every claim is
> traceable to `cv.yaml`, every agent action is auditable, and the visitor can
> verify both without a backend. The portfolio doesn't just _describe_
> governance; it _demonstrates_ it.

---

## Table of Contents

1. [Product Thesis & Differentiation](#1-product-thesis--differentiation)
2. [Information Architecture & Route Map](#2-information-architecture--route-map)
3. [Portfolio Narrative](#3-portfolio-narrative)
4. [Three Visual Directions](#4-three-visual-directions)
5. [Static / Live Boundary](#5-static--live-boundary)
6. [Domain Model](#6-domain-model)
7. [Provider Abstraction & Secret Boundaries](#7-provider-abstraction--secret-boundaries)
8. [API Contracts & Threat Model](#8-api-contracts--threat-model)
9. [Resume Strategy: cv.yaml → HTML + PDF](#9-resume-strategy)
10. [Repository & Module Structure](#10-repository--module-structure)
11. [Local Dev Architecture](#11-local-dev-architecture)
12. [Test Pyramid & Deterministic Evaluation](#12-test-pyramid--deterministic-evaluation)
13. [GitHub Pages Deployment](#13-github-pages-deployment)
14. [Optional Backend Deployment](#14-optional-backend-deployment)
15. [Accessibility & Performance](#15-accessibility--performance)
16. [Smallest Credible Vertical Slice (Tonight)](#16-smallest-credible-vertical-slice-tonight)
17. [Explicit Non-Goals for Tonight](#17-explicit-non-goals-for-tonight)
18. [Parallel Implementation Task DAG](#18-parallel-implementation-task-dag)
19. [Risks, Trade-offs, Rejected Alternatives](#19-risks-trade-offs-rejected-alternatives)
20. [ADRs to Create](#20-adrs-to-create)
21. [Naming Criteria & Collision Risks](#21-naming-criteria--collision-risks)
22. [Hard-Constraint Compliance Matrix](#22-hard-constraint-compliance-matrix)

---

## 1. Product Thesis & Differentiation

### Target audience

| Persona                     | Need                                         | Time budget   |
| --------------------------- | -------------------------------------------- | ------------- |
| Recruiter / hiring manager  | "Can this person do the job?" — quick signal | 30–90 seconds |
| Senior engineer / tech lead | Depth, real architecture, testable claims    | 5–15 minutes  |

### Thesis

Most developer portfolios are either (a) decorated link-lists with fabricated
metrics, or (b) raw GitHub repos with no narrative. The canonical CV describes
AI engineering work spanning identity, policy, audit, and observability. The
portfolio should embody those same values:

- **Provenance:** Every factual claim on the site traces to a specific key-path
  in `cv.yaml`. The site generates a provenance map at build time; visitors can
  inspect source attribution.
- **Verifiability:** The governance demo produces cryptographically-rooted
  evidence (Merkle audit, Ed25519 signatures) that the _browser re-verifies
  client-side_ — no trust in the server required.
- **Policy transparency:** The governance rules are public Rego, readable and
  re-evaluable.

### Differentiation from generic portfolios

| Generic pattern (banned)            | This proposal instead                                            |
| ----------------------------------- | ---------------------------------------------------------------- |
| Purple/blue gradient hero           | Restrained, print-influenced palettes (see §4)                   |
| Floating glass cards with blur      | Dense, information-first layouts                                 |
| Fake terminal with typed text       | Real trace timelines from actual run data                        |
| Decorative metrics ("99.9% uptime") | Only real numbers from cv.yaml (GPA, pilot scores, placement)    |
| PDF-in-iframe resume                | Semantic, generated HTML from cv.yaml; Typst PDF as downloadable |

---

## 2. Information Architecture & Route Map

All routes are **pre-rendered static HTML** — no server-side rendering at
request time. Each path maps to `path/index.html` for GitHub Pages compatibility.

```
/                    Home — thesis + narrative spine + entry points
/resume/             Generated HTML resume (semantic, print-friendly, accessible)
/work/               Experience & projects index (from cv.yaml)
/work/governance/    The Infosys governance role (clean-room public framing)
/work/rag-assistant/ Multimodal RAG project
/work/fridgeguard/   FridgeGuard (sensor analytics)
/work/nutrition/     Nutritional Assistant (RAG on Azure)
/work/urban-threads/ Urban Threads (retail analytics)
/lab/                Agent governance demo — Replay mode (default)
/lab/run/<id>/       Permalink to a specific recorded run
/colophon/           Provenance page: how claims are sourced, clean-room statement
/404.html            Custom 404 (also serves as SPA catch-all fallback)
```

**Static assets at root:** `robots.txt`, `sitemap.xml`, `.nojekyll`, `favicon.svg`.

No `CNAME` file (the target IS `diegoaleyvag.github.io`, not a custom domain).

---

## 3. Portfolio Narrative

The narrative arc is grounded **exclusively** in `cv.yaml` facts:

### Spine: "Building systems that make AI trustworthy"

1. **Foundations** — BSc Data Science at ESCOM–IPN (GPA 9.29/10, expected 2027);
   exchange at Queen Mary (Intro to AI: A; Multi-Platform Game Dev: B); Google
   certifications (AI Essentials, Cloud Computing Foundations, 2024).

2. **Applied AI** — Nutritional Assistant (fine-tuned GPT-4, 3 Azure AI Search
   indexes, 4.58/5 pilot satisfaction); Data Analyst Agent (sandboxed pandas
   from NL queries, automated visualisations); FridgeGuard (led data/product in
   team of 8, mould-risk logic for sensor data).

3. **Governance & reliability** — AI Engineering Intern at Infosys InStep:
   engineered Identity Module & DID/Credential service (W3C did:web/did:key,
   Ed25519); co-developed trust layer with 3 engineers (OPA/Rego policy gates,
   Merkle-tree audit evidence, OpenTelemetry observability); placed 3rd of 6
   finalists at InStep Project Fest 2026; presented in 3 technical reviews
   including a session with Infosys founder N. R. Narayana Murthy.

4. **What's next** — the clean-room demo on THIS site. Reimplements the public
   concepts (DIDs/VCs, OPA/Rego, Merkle audit, OpenTelemetry) from public specs
   only, as a standalone showcase. NOT a reproduction of Infosys IP.

**Provenance rule:** Every bullet above maps to an explicit cv.yaml key-path. A
build-time linter validates that no UI text contains factual claims without a
corresponding provenance annotation.

---

## 4. Three Visual Directions

Each direction shares a common token layer (CSS custom properties for color,
type scale, spacing, motion) so the final choice is a theme-swap, not a rebuild.
All three respect WCAG 2.2 AA contrast, `prefers-reduced-motion`, and
`prefers-color-scheme`.

### Direction A: "Dossier" — Editorial Provenance

**Concept:** The site reads like a verifiable archival record. Every factual
claim has a margin annotation citing its cv.yaml source, like footnotes in a
legal brief.

- **Layout:** Single-column editorial, wide left margin for provenance refs,
  ruled hairlines, section markers ("§01 Identity", "§02 Experience").
  Generous measure (~65ch), baseline grid.
- **Typography:** Text serif (Source Serif 4 or Newsreader) for prose; condensed
  grotesque (Inter Tight) for labels; monospace (JetBrains Mono) only for
  hashes/IDs.
- **Palette:** Warm paper `hsl(42, 30%, 95%)`, near-black ink `hsl(40, 10%, 8%)`,
  one accent — archival oxblood `hsl(0, 50%, 30%)` for verified states. No
  gradients.
- **Motion:** Minimal — a "seal" stamp reveal on verification; ink-fade
  entrances; `reduced-motion` → instant.
- **Demo rendering:** Run events as ledger rows; credentials as certificate
  cards; Merkle audit as a ruled table with computed root and a verification
  stamp.
- **Risks avoided:** No glass, no gradients, no glow, no decorative counters.

### Direction B: "Instrument" — Data-Ink Telemetry

**Concept:** A calm, precise reading instrument for agent behavior. Tufte
"data-ink ratio" discipline — every pixel of color encodes real data. Explicitly
NOT a hacker terminal (no blinking cursor, no green-on-black, no matrix).

- **Layout:** Modular grid; dense but airy; trace timelines as horizontal Gantt
  bars; tabular data with aligned figures; small-multiple sparklines.
- **Typography:** Technical grotesk (Inter or Geist) for UI; monospace only for
  numeric/hash data with `font-variant-numeric: tabular-nums`.
- **Palette:** Deep neutral ground `hsl(220, 10%, 7%)`, high-legibility
  foreground `hsl(0, 0%, 92%)`, ONE data-ink accent (amber `hsl(40, 90%, 55%)`)
  used strictly for data marks/lines — never as ambient glow. Status colors
  always paired with text labels (not color-only).
- **Motion:** Data-driven — spans draw in proportional to duration; reduced-motion
  → settled state immediately.
- **Demo rendering:** Trace timeline is the hero; policy decisions annotate span
  boundaries; audit panel shows hash chain with incremental root calculation.
- **Risks avoided:** No terminal emulation, no neon glow, no fake metrics. Every
  visible number comes from real run data.

### Direction C: "Schematic" — Systems Blueprint

**Concept:** The portfolio is a readable engineering schematic. Diego's story is
a walk along the signal path of a governed agent: Identity → Request → Policy
Gate → Tool Execution → Audit → Trace Emission.

- **Layout:** Spatial/diagram-first home; labeled nodes and directed edges;
  content panels dock to nodes when selected. Responsive: collapses to a
  vertical flow on mobile with connection lines.
- **Typography:** Condensed grotesk (Barlow Condensed or similar) for node
  labels/callouts; humanist sans (Atkinson Hyperlegible) for body text.
- **Palette:** "Drafting paper" — bone ground `hsl(45, 20%, 93%)`, graphite
  rules `hsl(0, 0%, 35%)`, one blueprint-accent blue `hsl(210, 60%, 40%)`. Fine
  0.5px grid underlay (subtle, structural, not skeuomorphic). No gradients.
- **Motion:** Edges carry a pulse as the recorded run flows; Policy Gate node
  opens (allow), holds (requires-approval), or blocks (deny); reduced-motion →
  static with text labels showing decision.
- **Demo rendering:** The demo IS the diagram animating — the run flows through
  schematic nodes. Clicking a node opens detail: credential at Identity, Rego
  decision at Policy, Merkle leaf at Audit, spans at Trace.
- **Risks avoided:** Not decorative — the diagram IS the architecture. No
  gradients, glass, fake terminals.

### Shared design-system substrate

All three consume the same `tokens.css` (color, space, type-scale, motion) with
theme variants. Switching direction = swapping a token set + ≤3 layout
components. The content layer, accessibility layer, and interactive logic are
unchanged.

---

## 5. Static / Live Boundary

The critical architectural insight:

> **The only thing that fundamentally requires a backend is fresh,
> non-deterministic LLM token generation. Everything governance-related is
> deterministic and therefore either precomputed or client-verifiable.**

### What is precomputed static JSON (checked into repo / built at build-time)

| Artifact                  | Source                                     | Lives at                           |
| ------------------------- | ------------------------------------------ | ---------------------------------- |
| HTML resume               | cv.yaml → Astro template                   | `/resume/index.html`               |
| Portfolio content         | cv.yaml → typed loader                     | All `/work/` pages                 |
| Provenance map            | cv.yaml key-paths → UI text                | Build artifact (JSON)              |
| Replay Run fixtures       | governance-core + Fake provider → Run JSON | `public/runs/*.json`               |
| Synthetic DID documents   | Generated keypairs (synthetic)             | Embedded in Run JSON               |
| Compiled Rego policies    | `.rego` → WASM (OPA)                       | `public/policies/*.wasm` (roadmap) |
| Trace data                | Part of Run JSON                           | Inline in fixture                  |
| Merkle roots + signatures | Part of Run JSON                           | Inline in fixture                  |

### What requires the optional runtime (Live mode only)

| Capability                          | Why it can't be static         |
| ----------------------------------- | ------------------------------ |
| Generate a NEW agent plan/reasoning | Non-deterministic LLM output   |
| Stream a live run                   | Requires Groq API key (secret) |
| Record a new Replay fixture         | Wraps the above                |

### Browser-side verification (runs client-side, zero backend)

The static site loads a Run JSON and the browser _re-verifies_ governance
claims:

1. **Ed25519 signature verification** — via Web Crypto API (native, no library).
2. **Merkle root recomputation** — SHA-256 over event leaves via SubtleCrypto.
3. **Policy decision audit** — display the recorded Rego input/output;
   full in-browser re-eval via OPA-WASM is a roadmap item (MVP shows
   recorded decisions with their input context).

This means the Replay demo is not just a "movie playback" — it _re-derives
cryptographic proofs_ in the visitor's browser, proving tamper-evidence without
trusting any server.

---

## 6. Domain Model

All names below are clean-room reimplementations of public concepts from W3C
DID/VC specs, OPA/Rego documentation, RFC 6962 (Certificate Transparency /
Merkle trees), and OpenTelemetry semantic conventions.

### Core entities

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Run (top-level artifact)                   │
├─────────────────────────────────────────────────────────────────────┤
│ id: string (deterministic from scenario + seed)                     │
│ schema_version: "1.0"                                               │
│ scenario: ScenarioRef                                               │
│ agent: AgentIdentity                                                │
│ events: Event[]    (ordered: plan, tool_calls, decisions, results)  │
│ trace: Trace       (OpenTelemetry-style spans)                      │
│ audit: AuditLog    (Merkle tree over events)                        │
│ metadata: { provider, timestamp, duration_ms }                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Entity definitions

**Agent** — Has a DID (`did:key:z6Mk...` for demo), holds Verifiable
Credentials (e.g. `ToolAccessCredential` issued by a synthetic authority),
declares a role, and lists allowed tool scopes. Credentials are Ed25519-signed
JWTs per W3C VC Data Model 2.0.

**Tool** — A callable capability with a typed input/output schema and a risk
classification (`low | medium | high | critical`). Invoking produces an Event.
Tools in the demo are synthetic no-ops (no real code execution, no RCE surface).

**Policy** — Declarative Rego rules. Given a request context `{ agent, credential_claims, tool, args, environment }`, returns a Decision:

- `allow` — proceed
- `deny { reason }` — block with explanation
- `require_approval { reason, approver_role }` — pause for human gate

**Approval** — Human-in-the-loop gate. When policy returns `require_approval`,
the run pauses; a synthetic approver issues a signed approval/denial decision,
appended to the event log.

**Trace** — OpenTelemetry-compatible spans: `{ trace_id, span_id, parent_id, name, kind, start_time, end_time, status, attributes }`. Covers: plan generation, each tool call, policy evaluation, approval wait, credential verification.

**Audit Log** — Append-only Merkle tree (RFC 6962 style). Each significant
event becomes a leaf (SHA-256 of canonical JSON). The tree produces a root hash;
optionally signed by the runtime's ephemeral key. Tamper-evidence: changing any
event invalidates the root; the browser recomputes and checks.

**Evaluation** — Deterministic scenario-based assertions. A scenario defines
agent + credentials + tools + a scripted interaction + EXPECTED governance
outcomes. The evaluation runner uses the Fake provider and asserts outcomes
match. No live inference.

### Run JSON — the linchpin contract

The Run JSON schema is the single cross-boundary interface between:

- Python runtime (produces runs)
- Static site (consumes + verifies runs)
- Test harness (validates runs)

Illustrative structure:

```jsonc
{
  "$schema": "https://diegoaleyvag.github.io/schemas/run-v1.json",
  "id": "run_abc123",
  "schema_version": "1.0",
  "scenario": { "id": "s01-data-query", "name": "Data Query with Policy Gate" },
  "agent": {
    "did": "did:key:z6MkhaXg...",
    "credentials": [{ "type": "ToolAccessCredential", "claims": {...}, "proof": {...} }]
  },
  "events": [
    { "type": "plan", "content": "I will query the dataset...", "span_id": "sp_01" },
    { "type": "tool_request", "tool": "query_dataset", "args": {...}, "span_id": "sp_02" },
    { "type": "policy_decision", "decision": "allow", "rule": "tools/query.rego", "span_id": "sp_03" },
    { "type": "tool_result", "output": {...}, "span_id": "sp_04" }
  ],
  "trace": { "spans": [...] },
  "audit": {
    "leaves": ["sha256:...", "sha256:..."],
    "root": "sha256:abc...",
    "signature": "ed25519:..."
  },
  "metadata": { "provider": "fake", "timestamp": "2026-08-01T00:00:00Z", "duration_ms": 42 }
}
```

This schema is versioned, validated by JSON Schema, and has generated types in
both TypeScript (for the site) and Python (for the runtime).

---

## 7. Provider Abstraction & Secret Boundaries

### Provider interface (Python, runtime-side)

```python
class Provider(Protocol):
    async def complete(
        self,
        messages: list[Message],
        tools: list[ToolDef],
        params: CompletionParams,
    ) -> ProviderResponse: ...
```

`ProviderResponse` contains: assistant message (text + tool-call intents),
token usage, and rate-limit metadata (if available).

### Three implementations

| Provider           | Behavior                                                                 | Needs secret?        | Used in                                      |
| ------------------ | ------------------------------------------------------------------------ | -------------------- | -------------------------------------------- |
| `FakeProvider`     | Returns scripted responses from scenario fixture                         | No                   | Unit tests, eval harness, fixture generation |
| `ReplayProvider`   | Reads stored ProviderResponses from a Run JSON                           | No                   | Integration tests, local dev                 |
| `GroqLiveProvider` | Calls Groq `/openai/v1/chat/completions`; parses `x-ratelimit-*` headers | Yes (`GROQ_API_KEY`) | Optional live runtime only                   |

### Selection

`LLM_PROVIDER` env var → factory returns the implementation. Caller code is
unchanged regardless of provider.

### Secret boundary (critical)

```
┌──────────────────────────────────────────────────────────────────┐
│                    BROWSER / STATIC SITE                          │
│  • Reads Run JSON from /runs/*.json (public, no secret)          │
│  • Optionally calls runtime API (public URL, no key in request)  │
│  • NEVER holds GROQ_API_KEY or any secret                        │
│  • Astro PUBLIC_* vars: only PUBLIC_RUNTIME_URL (a URL, not key) │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS (optional, live mode only)
┌─────────────────────────────▼────────────────────────────────────┐
│                    RUNTIME SERVER (optional)                       │
│  • GROQ_API_KEY in server env only                                │
│  • Never echoes key in responses                                  │
│  • CORS: allows site origin only                                  │
│  • Rate-limits read from Groq response headers, not hardcoded     │
└──────────────────────────────────────────────────────────────────┘
```

**Astro guardrail:** The Astro build config explicitly lists allowed env vars.
`GROQ_API_KEY` is NEVER referenced in any `astro.config.*`, `env.d.ts`, or
`import.meta.env.*` expression. A CI lint grep confirms no `PUBLIC_.*KEY` or
`PUBLIC_.*SECRET` patterns exist in source.

---

## 8. API Contracts & Threat Model

### Runtime API (optional, live mode only)

```
POST /api/runs
  Body: { scenario_id: string, params?: object }
  Response: Run JSON (streamed via SSE for progress, or full JSON)
  Auth: none from browser (key is server-side); optional rate-limit per IP

GET /api/runs/{id}
  Response: stored Run JSON (same as static fixtures)

GET /api/scenarios
  Response: ScenarioSummary[]

GET /api/health
  Response: { status: "ok", provider: "groq"|"fake"|"replay" }
```

### Threat model

| Asset                 | Threat                                       | Mitigation                                                                                     |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Groq API key          | Leak to browser/bundle/client                | Key only in runtime server env; never in static build; CI lint                                 |
| Site integrity        | XSS injecting false claims                   | CSP via `<meta>` (Pages limitation); no inline scripts; sanitized cv.yaml output               |
| Run integrity         | Tampered JSON to fake governance             | Merkle root + Ed25519 signature; browser re-verifies                                           |
| Diego's reputation    | Fabricated facts in UI                       | Provenance map + build-time lint; cv.yaml is read-only                                         |
| Runtime availability  | DoS                                          | Rate-limit per IP; backpressure from Groq headers; runtime is optional (site works without it) |
| Supply chain          | Malicious dependency                         | Lockfiles pinned; `pnpm audit` / `uv pip audit` in CI; minimal dependency tree                 |
| Live prompt injection | Adversarial input causing bad agent behavior | Tools are synthetic no-ops (no real effects); policy still gates; traces are observable        |

---

## 9. Resume Strategy

### Decision: generate HTML separately, reuse Typst for PDF

**HTML resume** (primary web experience): Generated at build time by the SSG
(Astro) reading `cv.yaml` via a typed content loader. Produces semantic,
accessible, responsive, linkable HTML at `/resume/`. Print-optimized CSS makes
`Ctrl+P` produce a reasonable PDF too, but the dedicated Typst PDF is superior
for ATS/download.

**PDF resume** (downloadable): Reuse Diego's existing `cv.yaml → Typst → PDF`
pipeline. Typst produces typographically superior, ATS-parseable PDFs that HTML
print stylesheets cannot match (precise page breaks, font embedding, microtypography).
Don't reinvent this.

### Justification

| Concern                        | HTML (Astro)                         | PDF (Typst)          |
| ------------------------------ | ------------------------------------ | -------------------- |
| Web accessibility / SEO        | ✓ semantic headings, landmarks, meta | ✗ opaque to crawlers |
| Responsive / mobile            | ✓                                    | ✗ fixed page size    |
| Linkable sections              | ✓ anchors                            | ✗                    |
| Print / ATS fidelity           | Acceptable                           | ✓ superior           |
| Typographic control            | Limited                              | ✓ precise            |
| Interactive (provenance links) | ✓                                    | ✗                    |

**Single source guarantee:** Both renderers consume the SAME `cv.yaml`. A CI
step hashes `cv.yaml` and verifies the committed PDF was built from that hash
(embeds hash in PDF metadata). If the hash drifts, CI fails.

### Build flow

```
cv.yaml ──┬──→ Astro content loader ──→ /resume/index.html (static)
           │
           └──→ Typst template ──→ resume.pdf ──→ /resume.pdf (static asset)
```

Both outputs land in the same static deploy. The PDF build can be a separate
GitHub Actions job that commits the PDF artifact, or builds on-demand in the
site workflow.

---

## 10. Repository & Module Structure

```
diegoaleyvag.github.io/                    # Repo name fixed by user-site requirement
├── .github/
│   └── workflows/
│       ├── ci.yml                         # Lint + typecheck + test (Fake/Replay only)
│       ├── deploy-site.yml                # Build Astro → deploy to Pages
│       └── build-pdf.yml                  # cv.yaml → Typst → resume.pdf
├── content/
│   └── source/
│       └── cv.yaml                        # CANONICAL, READ-ONLY
├── packages/
│   ├── run-schema/                        # JSON Schema + generated TS/Py types
│   │   ├── schema/run-v1.json
│   │   ├── ts/types.ts                    # Generated
│   │   └── py/models.py                   # Generated (Pydantic)
│   ├── governance-engine/                 # Python: identity, policy, merkle, trace
│   │   ├── identity/                      # DID resolution, VC issuance, Ed25519
│   │   ├── policy/                        # Rego evaluation (OPA subprocess or lib)
│   │   ├── audit/                         # Merkle tree build + sign
│   │   ├── trace/                         # Span builder (OTel-compatible)
│   │   └── runner.py                      # Orchestrates a full Run
│   ├── verifier/                          # TypeScript: browser-side re-verification
│   │   ├── ed25519.ts                     # Web Crypto verify
│   │   ├── merkle.ts                      # SHA-256 recompute
│   │   └── index.ts                       # Verify a Run JSON → VerificationResult
│   └── policies/                          # Rego source files (shared)
│       ├── tools/                         # Tool-access policies
│       └── risk/                          # Risk-tier escalation rules
├── apps/
│   ├── site/                              # Astro static site
│   │   ├── astro.config.ts
│   │   ├── src/
│   │   │   ├── pages/                     # Routes (see §2)
│   │   │   ├── layouts/
│   │   │   ├── components/                # Astro components
│   │   │   ├── islands/                   # Interactive (Preact/Svelte): run-player, trace-timeline, audit-verifier
│   │   │   ├── content/                   # cv.yaml loader + provenance map generator
│   │   │   └── styles/
│   │   │       ├── tokens.css             # Shared design tokens
│   │   │       ├── theme-dossier.css      # Direction A
│   │   │       ├── theme-instrument.css   # Direction B
│   │   │       └── theme-schematic.css    # Direction C
│   │   └── public/
│   │       ├── .nojekyll                  # CRITICAL: disables Jekyll on Pages
│   │       ├── robots.txt
│   │       ├── runs/                      # Replay fixtures (copied from fixtures/)
│   │       └── resume.pdf                 # Built by Typst pipeline
│   └── runtime/                           # OPTIONAL Python FastAPI server
│       ├── app.py                         # FastAPI application
│       ├── providers/
│       │   ├── base.py                    # Provider Protocol
│       │   ├── fake.py
│       │   ├── replay.py
│       │   └── groq.py
│       ├── routes/                        # /api/runs, /api/scenarios, /api/health
│       ├── Dockerfile
│       └── pyproject.toml
├── fixtures/
│   ├── runs/                              # Golden Run JSONs (source of truth for replay)
│   ├── scenarios/                         # Scenario YAML definitions
│   └── keys/                              # Synthetic Ed25519 keypairs (clearly labeled)
├── tests/
│   ├── unit/                              # Python: governance-engine; TS: verifier
│   ├── integration/                       # Full pipeline with Fake provider
│   ├── e2e/                               # Playwright: static site in Replay mode
│   ├── contract/                          # Cross-language: same Run verifies in Py + TS
│   └── live/                              # QUARANTINED: requires key, excluded from CI
├── docs/
│   ├── proposals/                         # This file
│   ├── judgements/
│   ├── adr/
│   ├── project-context.md
│   ├── hard-constraints.md
│   └── evaluation-rubric.md
├── resume/
│   └── template.typ                       # Typst template for PDF generation
├── .env.example
├── .gitignore
├── pnpm-workspace.yaml
├── package.json                           # Root: scripts, devDependencies (shared tooling)
├── pyproject.toml                         # Python workspace (uv)
├── justfile                               # Task runner (cross-language orchestration)
└── README.md
```

### Module justification

| Package             | Reason it exists separately                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `run-schema`        | The contract; consumed by both TS and Py; changes are breaking and must be versioned        |
| `governance-engine` | Python library: matches CV stack (Pydantic/FastAPI); used by runtime + fixture generation   |
| `verifier`          | TS library: runs in browser (Web Crypto); small, no server dependency                       |
| `policies`          | Shared Rego source: used by governance-engine (eval) and potentially browser (WASM roadmap) |

This is NOT microservices. There is exactly **one deployable static site** and
**one optional deployable runtime**. The packages are build-time modules within
a monorepo.

---

## 11. Local Dev Architecture

### Prerequisites

- Node.js ≥ 20 (via `.nvmrc`)
- pnpm ≥ 9
- Python ≥ 3.12
- uv (Python package/env manager)
- just (task runner) — or `make` fallback

### Commands

```bash
just install          # pnpm install + uv sync
just dev              # astro dev (site, Replay mode, port 4321)
just runtime          # uvicorn runtime (Fake provider default, port 8000)
just gen-fixtures     # Run governance-engine with Fake → write fixtures/runs/
just test             # All tests EXCEPT tests/live/ (Fake/Replay only)
just test-live        # Requires GROQ_API_KEY; manual only
just lint             # ESLint + Ruff + schema validation
just typecheck        # tsc --noEmit + pyright/mypy
just build            # Astro build → dist/ (the static output)
just deploy-local     # Serve dist/ with a static server (verify Pages behavior)
```

### Default modes

- `just dev` → `DEMO_MODE=replay` — the site loads `public/runs/` fixtures; no
  runtime needed.
- `just runtime` → `LLM_PROVIDER=fake` — deterministic; no Groq key needed for
  development.
- Live mode requires explicit `LLM_PROVIDER=groq` + `GROQ_API_KEY` in `.env`.

---

## 12. Test Pyramid & Deterministic Evaluation

### Pyramid

```
        ╱╲
       ╱E2E╲        Playwright: site loads, Replay works, a11y checks
      ╱──────╲       (~5 tests, slow, browser)
     ╱Contract╲      Same golden Run passes Py verifier + TS verifier
    ╱───────────╲    + tampered Run fails both (~10 tests)
   ╱ Integration ╲   Full pipeline: Fake → Run → schema-valid → assertions
  ╱───────────────╲  (~20 scenarios)
 ╱     Unit        ╲  DID/VC, Ed25519, Merkle, policy, schema, loaders
╱───────────────────╲ (~100+ tests, fast, isolated)
```

### Deterministic evaluation strategy

**Scenario fixtures** define:

- Agent identity + credentials
- Available tools + risk classifications
- A scripted task (messages the Fake provider will return)
- Expected governance assertions (which tools allowed/denied/escalated, Merkle
  root, trace structure)

**Evaluation runner:**

1. Load scenario.
2. Instantiate governance-engine with `FakeProvider`.
3. Execute the run.
4. Assert:
   - Each policy decision matches expected (decision, rule, reason).
   - Denied tools produced no execution event.
   - `require_approval` steps recorded a synthetic approver decision.
   - Merkle root equals the golden snapshot (canonical JSON, sorted keys,
     fixed clock, seeded IDs → deterministic).
   - Trace contains expected spans with correct parent/child structure.
   - Run validates against JSON Schema.
5. Optionally `--update-golden` regenerates golden snapshots.

**Cross-language contract test:** Feed the SAME golden Run to both the Python
`governance-engine` verifier and the TS `verifier` package. Both must agree on
`verified: true`. A tampered Run (one bit-flipped event) must make both report
`verified: false`.

**Live tests are quarantined:**

- Directory: `tests/live/`
- Requires env var `RUN_LIVE_TESTS=1` + `GROQ_API_KEY`
- Excluded from `just test` and CI
- Tests only adapter correctness (rate-limit header parsing, response shape) —
  NOT governance correctness.

---

## 13. GitHub Pages Deployment

### Plan

```yaml
# .github/workflows/deploy-site.yml
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter site build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: apps/site/dist
      - uses: actions/deploy-pages@v4
```

### Gotchas addressed

| Gotcha                             | Mitigation                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `_astro/` folder ignored by Jekyll | `.nojekyll` file in `public/` → deployed root                                |
| Trailing-slash 404s                | Astro `build.format: 'directory'` → `route/index.html`                       |
| SPA deep-link 404                  | All routes pre-rendered; `404.html` as fallback; no SPA hash routing         |
| `basePath` mismatch                | Astro `base: '/'` (or omit); site config: `'https://diegoaleyvag.github.io'` |
| CNAME redirection                  | No CNAME file (target IS the github.io domain)                               |
| Asset caching                      | Astro hashes static assets; long-cache safe                                  |
| Large fixture files                | Keep runs ≤ 50KB each; total `public/runs/` ≤ 500KB                          |

### Custom headers / CSP

GitHub Pages does not support custom HTTP headers. CSP is enforced via
`<meta http-equiv="Content-Security-Policy">` in the HTML `<head>`:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.runtime-host.example
```

`connect-src` includes the optional runtime URL (only needed for Live mode).

---

## 14. Optional Backend Deployment

The runtime is a stateless FastAPI container. It can deploy to any container
host without vendor lock-in:

```dockerfile
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
COPY apps/runtime/ .
COPY packages/governance-engine/ ../packages/governance-engine/
COPY packages/run-schema/py/ ../packages/run-schema/py/
RUN uv sync --frozen
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Candidate hosts (no lock-in — any Docker host works):

- Fly.io (free tier, global edge)
- Render (free tier, auto-deploy from branch)
- Railway
- Google Cloud Run

Environment:

- `GROQ_API_KEY` — set in host's secret store
- `LLM_PROVIDER=groq`
- `GROQ_MODEL=llama-3.1-70b-versatile` (or current best on Groq)
- `ALLOWED_ORIGINS=https://diegoaleyvag.github.io`

The static site functions identically whether the runtime exists or not. If
`PUBLIC_RUNTIME_URL` is unset or the runtime is down, the site shows Replay mode
only (graceful degradation, not an error).

---

## 15. Accessibility & Performance

### Accessibility (WCAG 2.2 AA baseline)

- Semantic HTML: proper heading hierarchy, landmarks, `<article>`, `<nav>`, `<main>`
- Resume: a well-structured document outline (headings, lists, `<dl>` for skills)
- Keyboard navigation: all interactive elements focusable; visible focus ring
- Trace timeline: tabular fallback (`<table>`) for screen readers; not
  conveyed by color alone (text labels on every decision)
- Motion: all animation gated on `prefers-reduced-motion` (instant state, no motion)
- Color contrast: minimum 4.5:1 for text, 3:1 for large text / UI elements
- The demo run data is rendered as a readable `<table>` at build time (progressive
  enhancement: enhanced to interactive timeline with JS island — content accessible
  without JS)
- Alt text on all images; SVG diagrams have `<title>` + `<desc>` + `aria-label`

### Performance targets

| Metric                   | Target              | How                                                                  |
| ------------------------ | ------------------- | -------------------------------------------------------------------- |
| LCP                      | < 1.5s              | Static HTML, no blocking JS, optimized fonts                         |
| CLS                      | 0                   | No dynamic layout; font `size-adjust` or system stack                |
| FID/INP                  | < 100ms             | Islands load async; governance verification off main thread (Worker) |
| Total JS (content pages) | 0 KB                | Astro zero-JS default; no islands on portfolio/resume                |
| Total JS (demo page)     | < 80 KB gzipped     | Verifier + timeline island; Web Crypto is native                     |
| Lighthouse score         | ≥ 95 all categories | CI check via `lighthouse-ci`                                         |

### Font strategy

Self-hosted, subset variable font (WOFF2). One weight range per family. Use
`font-display: swap` + `size-adjust` to prevent CLS. System font stack as
fallback. No Google Fonts CDN (avoids third-party request + GDPR concern).

---

## 16. Smallest Credible Vertical Slice (Tonight)

The goal: an end-to-end demonstrable system by end of session.

### Delivers

1. **Astro project scaffold** with the route structure, tokens, and one visual
   direction (choose the simplest to implement first — likely Direction A
   "Dossier" or a neutral base with tokens ready for theming).

2. **`/resume/` page** — semantic HTML generated from `cv.yaml` via a typed
   content loader. Accessible, print-friendly. Links to a placeholder PDF (or
   the real Typst output if pipeline is fast to wire).

3. **`/` home page** — the thesis statement + a short narrative pulling name,
   headline, summary, and experience highlights from cv.yaml. Not decorative
   filler — real content, grounded.

4. **One hand-authored Run JSON** committed to `fixtures/runs/` and copied to
   `public/runs/`. Represents a synthetic scenario (e.g. "agent requests data
   query tool; policy allows; agent requests admin tool; policy denies").
   Contains valid Ed25519 signature and Merkle root (generated by a small seed
   script using Node's `crypto` or a Python one-liner).

5. **`/lab/` page with a Replay player island** that:
   - Loads the fixture Run JSON
   - Renders the event sequence as a step list
   - Shows agent identity + credential (DID, claims)
   - Shows each policy decision (allow/deny) with context
   - Computes Merkle root from events using SubtleCrypto and displays
     "Verified ✓" / "Tampered ✗"
   - Verifies the Ed25519 signature via Web Crypto

6. **`.nojekyll`** + Astro config for domain-root Pages deploy.

7. **Unit tests:** Merkle recompute (TS), Ed25519 verify (TS), cv.yaml schema
   validation (TS/zod).

8. **One Playwright smoke test:** the site loads at `/lab/`, the replay player
   renders events, verification shows "Verified."

### What this proves

- The static/live boundary works (Replay with zero backend).
- The governance concepts are real (crypto verification in browser).
- The resume is generated from cv.yaml (single source of truth).
- GitHub Pages deployment is achievable (`.nojekyll`, correct paths).
- The architecture isn't vaporware.

---

## 17. Explicit Non-Goals for Tonight

- ❌ Live Groq runtime (no server deployed tonight)
- ❌ OPA-WASM in-browser policy re-evaluation (show recorded decisions; WASM is roadmap)
- ❌ Full Python governance-engine (hand-author the seed Run; engine comes next)
- ❌ Multiple visual themes implemented (one theme + token layer ready for swap)
- ❌ Per-project detail pages beyond stubs
- ❌ Approval workflow UI (show it in the run data; interactive approval comes later)
- ❌ Typst pipeline integration (link placeholder or pre-built PDF)
- ❌ Multi-run gallery (one run is sufficient to prove the architecture)
- ❌ Animated schematic/trace timeline (tabular first; enhance later)
- ❌ CI/CD pipeline (works locally tonight; CI is session 2)
- ❌ Provenance lint (the map structure exists; enforcement comes next)
- ❌ Database / persistence (runs are files)

---

## 18. Parallel Implementation Task DAG

```
                    ┌─────────────────┐
                    │  A: run-schema  │  (JSON Schema + TS types)
                    │  owns: packages/run-schema/
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
   ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
   │ B: verifier  │  │ C: fixture  │  │ D: site scaffold │
   │ (TS, browser)│  │ (seed Run)  │  │ (Astro + routes) │
   │ owns:        │  │ owns:       │  │ owns: apps/site/ │
   │ packages/    │  │ fixtures/   │  │ (EXCEPT islands) │
   │ verifier/    │  │             │  │                  │
   └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘
          │                  │                   │
          │        ┌─────────┘                   │
          ▼        ▼                             ▼
   ┌────────────────────┐              ┌──────────────────┐
   │ E: demo islands    │              │ F: resume page   │
   │ (run-player,       │              │ (cv.yaml loader, │
   │  audit-verifier)   │              │  semantic HTML)  │
   │ owns: apps/site/   │              │ owns: apps/site/ │
   │   src/islands/     │              │   src/pages/     │
   └────────┬───────────┘              │   resume/       │
            │                          └────────┬─────────┘
            ▼                                   ▼
   ┌─────────────────────────────────────────────────────┐
   │ G: integration + Playwright tests                    │
   │ owns: tests/                                         │
   └─────────────────────────────────────────────────────┘
```

### Critical path for tonight

**A → B + C (parallel) → E → G**

D and F can proceed in parallel with everything (they depend only on cv.yaml,
not on the schema/verifier).

### Ownership boundaries

| Agent/workstream           | Owns                                                   | Depends on                       |
| -------------------------- | ------------------------------------------------------ | -------------------------------- |
| Schema                     | `packages/run-schema/`                                 | Nothing (root dependency)        |
| Verifier                   | `packages/verifier/`                                   | run-schema                       |
| Fixture seed               | `fixtures/`                                            | run-schema (+ crypto primitives) |
| Site framework             | `apps/site/` (layout, routes, styles, content loaders) | cv.yaml                          |
| Demo islands               | `apps/site/src/islands/`                               | verifier + fixture               |
| Resume                     | `apps/site/src/pages/resume/`                          | cv.yaml content loader           |
| Tests                      | `tests/`                                               | All of the above                 |
| Runtime (future)           | `apps/runtime/`                                        | run-schema + governance-engine   |
| Governance engine (future) | `packages/governance-engine/`                          | run-schema + policies            |

---

## 19. Risks, Trade-offs, Rejected Alternatives

### Risks

| Risk                                          | Likelihood | Impact                      | Mitigation                                                          |
| --------------------------------------------- | ---------- | --------------------------- | ------------------------------------------------------------------- |
| OPA-WASM too complex for browser              | Medium     | Demo can't re-eval policies | MVP shows recorded decisions; defer WASM; still verifies crypto     |
| Two languages (TS + Py) increases maintenance | Medium     | Higher onboarding cost      | Clean contract boundary (Run JSON); each lang used where justified  |
| Astro islands hydration edge cases            | Low        | Broken interactivity        | Islands are small/simple; fallback to static table                  |
| Fixture runs become stale                     | Medium     | Demo shows outdated schema  | Schema version in Run; CI validates fixtures against current schema |
| Groq rate limits change                       | Low        | Live mode errors            | Read limits from headers (never hardcode); graceful degradation     |
| Content drift (fabrication creep)             | Medium     | Severe penalty              | Provenance map + lint; cv.yaml read-only; PR review                 |

### Trade-offs accepted

| Trade-off                      | Chosen                                   | Alternative           | Reason                                                                   |
| ------------------------------ | ---------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| Two languages                  | TS (site/verifier) + Py (engine/runtime) | All-TS                | Py matches CV (Pydantic/FastAPI); credibility > convenience              |
| Monorepo                       | Single repo, packages + apps             | Polyrepo              | Atomic changes; single source of truth; simpler CI                       |
| Astro over Next.js             | Astro                                    | Next.js static export | Zero-JS default; content-first; no `_next/` confusion; not generic       |
| No database                    | File-based runs                          | SQLite/Postgres       | Runs are files (simplicity); DB is optional future extension             |
| Synthetic tools (no real exec) | No-op tools                              | Sandboxed execution   | No RCE surface; clean-room safer; demo is about governance not execution |

### Rejected alternatives

| Rejected                                    | Why                                                                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Next.js                                     | Heavier; `_next/` asset folder; SSR/ISR assumptions leak in; feels generic for portfolios; React tax on content pages |
| SvelteKit                                   | Good but less content-focused than Astro; smaller ecosystem for content                                               |
| All-in-browser governance (no Python)       | Loses CV credibility (Diego's work is Python); harder to test; WASM-only policy is fragile                            |
| Hugo / Eleventy                             | Excellent for pure content but poor developer experience for interactive islands                                      |
| A separate demo app (different repo/deploy) | Violates "single place on the web"; complicates navigation; needless separation                                       |
| Real code execution in tools                | RCE risk; clean-room concern; unnecessary for governance showcase                                                     |
| PDF-only resume (Typst in iframe)           | Rubric penalty (−10); not accessible/SEO/responsive                                                                   |
| Purple/gradient AI aesthetic                | Rubric penalty (−10); indistinguishable from thousands of AI landing pages                                            |

---

## 20. ADRs to Create

Each ADR follows the format: Status, Context, Decision, Consequences.

| ADR      | Decision                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------- |
| ADR-0001 | Static site generator: Astro (content-first, islands, zero-JS default, static export)             |
| ADR-0002 | Governance engine: Python (Pydantic v2 / FastAPI); browser verifier: TypeScript (Web Crypto)      |
| ADR-0003 | Cross-boundary contract: Run JSON (versioned, JSON-Schema'd, signed, Merkle-rooted)               |
| ADR-0004 | Provider abstraction: Fake / Replay / Live-Groq; secrets server-side only                         |
| ADR-0005 | Policy engine: OPA/Rego; target WASM for shared eval; MVP uses recorded decisions                 |
| ADR-0006 | Resume: HTML via Astro from cv.yaml (primary) + Typst PDF (secondary); single source, drift check |
| ADR-0007 | Package management: pnpm (TS) + uv (Python); monorepo; justfile orchestration                     |
| ADR-0008 | Deployment: GitHub Actions → Pages with `.nojekyll`; runtime via container (any host)             |
| ADR-0009 | Demo safety: synthetic data only; tools are no-ops; no code execution; clean-room boundary        |
| ADR-0010 | Visual direction: (deferred to post-judgement; token system supports all three)                   |

---

## 21. Naming Criteria & Collision Risks

### Criteria for the project/demo name

- Short (≤ 3 syllables), pronounceable, spellable
- Evokes: provenance, trust, verification, governance, audit, or transparency
- Does NOT imply: Infosys, any employer, "AI" generically, blockchain/crypto currency
- Available: npm, PyPI, GitHub org (or at least not a major project)
- ASCII-only, works as a URL path segment and CLI command
- No trademark conflict with major projects in the identity/security space

### Collision risks in the trust/audit namespace

| Name direction          | Known collisions                         | Risk    |
| ----------------------- | ---------------------------------------- | ------- |
| "Attest*"               | Google Attestation, in-toto attestations | High    |
| "Ledger*"               | Ledger (hardware wallet trademark)       | High    |
| "Provenance"            | SLSA Provenance, npm provenance          | High    |
| "Sigstore/Rekor/Cosign" | Sigstore project (Linux Foundation)      | Blocked |
| "Keylime"               | CNCF Keylime (TPM attestation)           | Blocked |
| "Witness"               | witness.dev (TL transparency project)    | Medium  |
| "Audit*"                | Many; generic                            | Medium  |
| "Trace*"                | OpenTelemetry Trace; generic             | Medium  |
| "Gate/Gateway"          | Many API gateways                        | Medium  |
| "Verify/Veritas"        | Multiple projects                        | Medium  |

### Safer directions to explore (not committed)

- Compound words with a non-obvious modifier (e.g. a Spanish/scientific/archival term)
- Action-oriented verbs less used in security (e.g. "attest" is taken but "vouch," "warrant," "certify" are less congested)
- Abstract nouns from trust theory (e.g. "assurance," "reliance")
- Deliberately non-English (Diego is bilingual ES/EN) — but must be pronounceable in English

**Final name selection is deferred to ADR-0010 after a proper availability search.
The site routes use `/lab/` as a neutral placeholder.**

---

## 22. Hard-Constraint Compliance Matrix

| Hard Constraint                                                     | How This Proposal Satisfies It                                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Published from `diegoaleyvag/diegoaleyvag.github.io` at domain root | Astro `base: '/'`; `site: 'https://diegoaleyvag.github.io'`; Actions deploys to Pages from this repo |
| No other GitHub owner assumed                                       | Only `diegoaleyvag` referenced                                                                       |
| Fully static bundle                                                 | Astro static output; no SSR; HTML/CSS/JS + JSON fixtures only                                        |
| Client-side routing works with static hosting                       | Pre-rendered routes (`path/index.html`); no hash routing; `404.html` fallback                        |
| Replay mode with zero backend                                       | Loads `public/runs/*.json`; verifies with Web Crypto; no fetch to any server                         |
| Replay data is pre-recorded static JSON                             | `fixtures/runs/` → `public/runs/`; checked into repo                                                 |
| Live runtime independently deployable                               | Separate `apps/runtime/` with own Dockerfile; site works without it                                  |
| Three providers: Fake / Replay / Live                               | Defined in §7; `LLM_PROVIDER` env selects                                                            |
| First live provider is Groq (OpenAI-compatible)                     | `GroqLiveProvider` calls `/openai/v1/chat/completions`                                               |
| Rate limits from response headers, never hardcoded                  | Reads `x-ratelimit-*` headers; applies backpressure dynamically                                      |
| Swapping providers = config only                                    | `LLM_PROVIDER` env var; no caller code changes                                                       |
| No API key in browser/bundle/client var                             | Key only in runtime server env; Astro never references it; CI lint enforces                          |
| Secrets in local/server env only                                    | `.env` (gitignored); host secret store for deploy                                                    |
| `.env.example` = placeholders only                                  | Already exists in repo with empty values                                                             |
| `.gitignore` excludes env files                                     | Already present in repo                                                                              |
| No proprietary Infosys reuse                                        | Clean-room: only public specs (W3C, OPA, RFC 6962, OTel); explicitly stated                          |
| Only public concepts reimplemented                                  | DIDs/VCs, OPA/Rego, Merkle trees, OpenTelemetry — all from public docs                               |
| Doubt resolved by omission                                          | Tools are no-ops; no sandboxed execution; no proprietary pattern reuse                               |
| All data is synthetic                                               | Fixtures use synthetic agents/tools/scenarios; clearly labeled; no real PII                          |
| No real PII or patient data                                         | Synthetic scenario data only                                                                         |
| Modern tooling preferred (uv)                                       | uv for Python; pnpm for TS; justified in ADR-0007                                                    |
| Notable choices recorded as ADRs                                    | 10 ADRs identified (§20)                                                                             |
| Choices justified against goals                                     | Each decision references rubric/constraints                                                          |
| Trunk-based dev, Conventional Commits                               | Defined; short-lived branches; CI on PR                                                              |
| No force-push to main                                               | Standard branch protection                                                                           |
| Changes reviewed before integrating                                 | PR-based workflow                                                                                    |
| No AI co-author trailers                                            | Commit template excludes them                                                                        |
| cv.yaml read-only, never altered                                    | Build reads it; never writes; provenance lint validates                                              |
| No fabricated metrics/experience                                    | Provenance map traces every claim to cv.yaml; lint enforces                                          |

### Penalty Avoidance

| Penalty                              | How avoided                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| Generic AI aesthetics (−10)          | Three distinctive directions defined; all ban gradients/glass/fake terminals; §4       |
| Resume-as-decoration (−10)           | HTML generated from cv.yaml via Astro; semantic, accessible; §9                        |
| Needless microservices (−10)         | Exactly ONE static site + ONE optional runtime; packages are build-time modules        |
| Vendor lock-in (−10)                 | No paid vendor required; Pages is free; runtime is any Docker host; OPA is open-source |
| Tests depend on live inference (−10) | Live tests quarantined in `tests/live/`; all CI uses Fake/Replay; §12                  |
| Exposed secrets (−25)                | Key never in browser/bundle/PUBLIC_ var; CI lint; §7, §8                               |
| Blocks GitHub Pages export (−20)     | `.nojekyll`; pre-rendered routes; `base: '/'`; no SPA assumption; §13                  |
| Fabricated facts (−25)               | Provenance map; cv.yaml read-only; build lint; §3                                      |

---

## Appendix: Key Architectural Decisions Summary

1. **The Run JSON is the product.** It's what the engine produces, what the site
   consumes, what the browser verifies, and what tests assert against. One
   artifact, many consumers.

2. **Verification ≠ execution.** The browser only VERIFIES (signatures, Merkle,
   recorded decisions). It never EXECUTES governance logic or LLM inference.
   This is architecturally analogous to the VC model: issuers sign, verifiers
   check.

3. **The portfolio IS the governance demo.** The site's own provenance system
   (cv.yaml → claims → audit) is a micro-instance of the same pattern the
   `/lab/` demo shows at scale. This recursive coherence is the differentiator.

4. **Static is the ceiling, not the floor.** Live mode adds capability but the
   static site is complete and useful on its own. The runtime is an enhancement,
   not a dependency.

---

_Proposal submitted blind. No other proposals consulted._
