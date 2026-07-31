# Blind Architecture Judgement

Scored independently against `docs/evaluation-rubric.md` and
`docs/hard-constraints.md`. No other judges' scores, git history, branch names,
or filenames outside the three anonymized candidate files were consulted.

---

## 1. Full Scoring Matrix

### Per-criterion scores

| #   | Criterion (weight)                         | A      | B      | C      |
| --- | ------------------------------------------ | ------ | ------ | ------ |
| 1   | Portfolio distinctiveness & narrative (15) | 14     | 12     | 7      |
| 2   | Technical credibility & depth (15)         | 15     | 14     | 5      |
| 3   | Static/live architecture quality (15)      | 15     | 14     | 7      |
| 4   | MVP feasibility tonight (10)               | 7      | 9      | 7      |
| 5   | Agent-governance & evaluation design (15)  | 15     | 12     | 4      |
| 6   | Maintainability & testing (10)             | 10     | 9      | 4      |
| 7   | Security & clean-room compliance (15)      | 15     | 13     | 7      |
| 8   | Deployment simplicity (5)                  | 5      | 5      | 3      |
|     | **Raw total**                              | **96** | **88** | **44** |

### Penalties applied

| Penalty                                 | A     | B     | C     |
| --------------------------------------- | ----- | ----- | ----- |
| Generic AI aesthetics (−10)             | 0     | 0     | 0     |
| Resume-as-decoration (−10)              | 0     | 0     | 0     |
| Needless microservices (−10)            | 0     | 0     | 0     |
| Vendor lock-in (−10)                    | 0     | 0     | 0     |
| Tests depend on live inference (−10)    | 0     | 0     | 0     |
| Exposed secrets (−25)                   | 0     | 0     | 0     |
| Blocks GitHub Pages static export (−20) | 0     | 0     | 0     |
| Fabricated facts (−25)                  | 0     | 0     | 0     |
| **Total penalties**                     | **0** | **0** | **0** |

### Final scores

| Candidate | Raw | Penalties | Final  |
| --------- | --- | --------- | ------ |
| **A**     | 96  | 0         | **96** |
| **B**     | 88  | 0         | **88** |
| **C**     | 44  | 0         | **44** |

---

## 2. Per-criterion Reasoning

### 1 — Portfolio distinctiveness & narrative

**A (14/15).** "Evidence-first flagship" is a genuinely distinctive thesis. The
two-speed reading model (recruiter skims the profile; engineer inspects
governance evidence) is well-motivated. Three visual directions are described
with specific palettes, type systems, and anti-patterns. Direction A (editorial
evidence ledger) has concrete design tokens: off-white surface, near-black type,
one signal color, humanist sans-serif for body, serif for openings, monospace
for hashes only. The explicit ban list (no oversized slogans, no purple
gradients, no floating glass, no fake terminals, no decorative counters, no
open chatbot) demonstrates conscious differentiation. Narrative grounding in
`cv.yaml` is meticulous: source-path references, completeness tests, a rule
that no LLM writes production copy, and a prohibition on words like "senior,"
"production-scale," "expert," and unstated impact numbers. Lost 1 point only
because the recommended Direction A, while distinctive, still occupies a
familiar "editorial / provenance" territory that other technically-oriented
portfolios have explored.

**B (12/15).** The recursive-coherence thesis ("the portfolio IS the governance
demo") is the strongest single differentiating idea across all three proposals.
Three visual directions are richly specified — Direction A "Dossier" with
archival oxblood and section markers, Direction B "Instrument" with Tufte
data-ink discipline and amber accent, Direction C "Schematic" with drafting-paper
grid and signal-path animation. The shared `tokens.css` substrate is a practical
touch. The provenance rule (build-time linter validates no UI text without a
cv.yaml annotation) is strong. However, the thesis section contains the phrase
"built agent-governance infrastructure at production scale." The CV states
"AI Engineering Intern." Whether an intern's work is "production scale" is an
inference not grounded in `cv.yaml`. The proposal's own safeguards (provenance
linter, "only real numbers from cv.yaml") would catch this before production,
and the narrative bullets in §3 are carefully mapped to cv.yaml key-paths, so
the full −25 fabrication penalty is not warranted. But the phrase represents a
factual-integrity risk that must be corrected, and it slightly undermines the
proposal's credibility as a model of the discipline it advocates. Scored 12
rather than 14 on this basis.

**C (7/15).** The thesis is reasonable ("live, verifiable proof of engineering
competence") but generic — it could describe many AI portfolios. Three visual
directions are listed but described in a few sentences each with no specific
color values, type stacks, motion guidelines, or design tokens. Labels like
"The Enterprise Reality" and "The Builder" are stock narrative beats. No
provenance mechanism is defined beyond general statements. The proposal is not
distinctive enough to be memorable in seconds.

### 2 — Technical credibility & depth

**A (15/15).** The domain model is exceptionally detailed: `AgentManifest`,
`CredentialEnvelope`, `ToolManifest`, `PolicyBundle`, `PolicyDecision`,
`ApprovalRequest`, `ApprovalDecision`, `Run`, a typed append-only event
vocabulary with schema versions and sequence-number invariants, `Trace` with
OpenTelemetry span mapping and attribute allowlists, audit evidence with
domain-separated hashing and a publicly documented Merkle construction,
`EvaluationCase` with fixture versions and integer-weighted assertions. The
provider abstraction distinguishes normalized failures (invalid request, timeout,
cancellation, rate-limited, unavailable, malformed response, internal error).
The Live adapter reads Groq rate-limit headers, normalizes them, and treats
missing headers as unknown. Rego compiled to WebAssembly avoids an OPA sidecar.
The API contract (`POST /v1/runs` accepting only a `scenario_id` and finite
`variant` enum) is narrow by design. Every technical claim is precise and
specific. Full marks.

**B (14/15).** The domain model is well-structured. The Run JSON schema is
illustrated with a concrete example. Entity definitions (Agent with DID, Tool
with risk classification, Policy with Rego decisions, Trace with OTel spans,
Audit Log with RFC 6962 Merkle construction) are clear. The cross-language
contract (Python governance-engine producing Run JSON, TypeScript verifier
consuming it in the browser) is a genuine architectural insight justified by
Diego's CV stack. The provider Protocol in Python is clean. OPA-WASM is
honestly deferred as a roadmap item (MVP shows recorded decisions). Lost 1
point because the domain model, while solid, does not reach A's level of
precision on event-ordering invariants, approval-binding semantics, or
telemetry attribute constraints.

**C (5/15).** The domain model consists of five one-line definitions (Agent,
Tool, Policy, Trace, Evaluation). No schemas, no event vocabularies, no state
machines, no approval workflows, no trace structures, no failure modes. The API
contract (`POST /api/execute` with `{ "intent": string, "context": object }`)
is dangerously vague — an open `intent` string field could accept arbitrary user
input, which conflicts with synthetic-data-only requirements and opens prompt
injection risk. The threat model is three bullet points. The technical depth is
insufficient for a 15-point category.

### 3 — Static/live architecture quality

**A (15/15).** Clean, explicit separation. The static site owns all portfolio
HTML, CSS, fonts, schemas, replay bundles, embedded DID documents, policy
digests, trace data, Merkle roots, evaluation results, and browser-side
verification code. The optional runtime alone owns the Groq key, live HTTP
calls, server config, and live Rego evaluation. Import rules enforce trust
boundaries: `apps/site` may not import `apps/runtime`, the Groq adapter, or
Node built-ins. "The static site must build and operate when the runtime URL is
absent" is stated as a hard requirement. Replay uses logical event offsets, not
delayed server requests. Provider selection occurs at the runtime composition
root through `LLM_PROVIDER`; the orchestrator never branches on provider type.
Full marks.

**B (14/15).** The static/live table clearly delineates what is precomputed vs.
what requires the optional runtime. The critical insight ("the only thing that
fundamentally requires a backend is fresh, non-deterministic LLM token
generation") is well-stated. Browser-side verification using Web Crypto (native,
no library) is specified. The secret boundary diagram is explicit. If
`PUBLIC_RUNTIME_URL` is unset or the runtime is down, the site shows Replay
only. Lost 1 point because the proposal mentions `PUBLIC_RUNTIME_URL` as an
Astro `PUBLIC_*` variable. While this is a URL (not a secret), the naming
pattern introduces a client-exposed configuration surface that should be
carefully bounded, and the proposal does not fully articulate the import-rule
enforcement that A provides.

**C (7/15).** The separation is stated at a high level: "the frontend detects
the presence of a configured backend URL." But the framework choice is left open
("Astro or Next.js Static Export" for web, "FastAPI or Hono" for API), which
means the actual architecture is undetermined. No discussion of import
boundaries, trust boundaries, or how Replay mode loads and processes data. The
API surface allows arbitrary input. Not enough detail to evaluate whether the
separation would hold under implementation.

### 4 — MVP feasibility tonight

**A (7/10).** The tonight slice is ambitious: Direction A design tokens, global
shell, keyboard navigation, responsive layout; three routes (`/`, `/resume/`,
`/lab/replay/`); one synthetic scenario with three variants (allowed read,
approval-granted action, missing-capability denial); real build-time Rego
decisions via Fake provider; ordered events, traces, Merkle root, and
browser-verifiable inclusion proof; unit tests for resume coverage, policy
outcomes, event order, Merkle tampering; Playwright flow and accessibility scan;
a Pages workflow. The scope is clearly defined and the "definition of
tonight-done" is testable. But achieving real Rego compilation, three governance
variants with full event sequences, Merkle proofs, AND browser verification in
one evening is aggressive. The proposal acknowledges scope cuts (PDF omitted if
pipeline fails, work-detail and run-summary pages deferred), which helps.
Scored 7: feasible with moderate scope-trimming, but tonight likely yields a
working skeleton with some verification shortcuts.

**B (9/10).** Tonight's slice is pragmatically scoped: Astro scaffold with route
structure and one visual direction; `/resume/` from cv.yaml; `/` home with
thesis and grounded narrative; one hand-authored Run JSON with valid Ed25519
signature and Merkle root (generated by a seed script); `/lab/` with a Replay
player island that renders events, shows identity/credentials, displays policy
decisions, and performs browser-side Merkle and Ed25519 verification; unit tests
for Merkle, Ed25519, and cv.yaml schema; one Playwright smoke test. Crucially,
the full Python governance-engine is explicitly deferred — the first Run JSON is
hand-authored. This is the right trade-off for night one: it proves the
architecture end-to-end without building the full execution pipeline. Highly
achievable. Lost 1 point only because even a hand-authored Run JSON with valid
cryptographic material requires careful construction.

**C (7/10).** The tonight slice is minimal: one statically exported page with
an HTML resume from cv.yaml, a hardcoded read-only view of a single replay
trace with a synthetic DID, a mocked policy result, and a Merkle root. Deployed
to GitHub Pages. This is achievable but barely proves the architecture. A
hardcoded, read-only view with mocked governance results does not demonstrate
that the governance system works — it demonstrates that static HTML can be
deployed. The scope is technically feasible (hence 7, not lower) but the "proof
of architecture" value is low.

### 5 — Agent-governance & evaluation design

**A (15/15).** The governance design is comprehensive and precisely grounded
in named public specifications. The domain model covers identity (DID Core,
`did:key` and synthetic `did:web`), credentials (W3C VC Data Model, Ed25519
proofs, narrow support profile, fail-closed on unsupported methods), tools
(typed manifests with side-effect classes, timeout bounds, policy action
binding), policy (Rego source with digest, compiled WASM artifact,
`allow`/`deny`/`needs_approval` decisions, malformed-output-as-deny), approval
(exact argument-digest binding, one-time scope, expiry, replay protection),
events (append-only vocabulary with sequence numbers, logical timestamps,
state-machine invariants), traces (OpenTelemetry spans with attribute
allowlists, no prompts/credentials/keys in telemetry), and audit evidence
(domain-separated hashing, Merkle root with inclusion paths,
externally-comparable release checksums, honest UI wording about same-origin
limitations). The evaluation design specifies 8 concrete synthetic cases with
exact structural assertions, integer-weighted scores, and property tests.
Explicitly rejects LLM-as-judge. Full marks.

**B (12/15).** The design is solid and references the right public specs (W3C
DID/VC, OPA/Rego, RFC 6962, OpenTelemetry). The Run JSON as a cross-boundary
contract is well-conceived. The cross-language verification (Python produces,
TypeScript re-verifies in browser) is a strong idea. The evaluation strategy
with deterministic scenario fixtures and golden-snapshot comparison is credible.
However, the approval model is less detailed than A's (no discussion of
argument-digest binding, expiry, or replay protection). The event vocabulary
is listed but not typed with the precision of A's state-machine invariants.
OPA-WASM is deferred. The evaluation cases are described generically rather
than as 8 specific scenarios.

**C (4/15).** The governance design is superficial. The domain model is five
one-line definitions. No approval workflow, no event vocabulary, no
state-machine invariants, no trace structure beyond a one-sentence mention. The
evaluation strategy mentions "Merkle-tree audit of the trace" but provides no
detail on construction, verification, or claim limits. No specific evaluation
cases are defined. This does not constitute a credible governance design.

### 6 — Maintainability & testing

**A (10/10).** Five-layer test pyramid: (1) domain and rendering unit tests
covering CV schema, resume field coverage, event transitions, credential
validity, tool validation, approval binding, canonical hashing, Merkle proofs,
telemetry allowlists, provider determinism; (2) policy and provider contract
tests including `opa test`, WASM/native parity, and provider conformance
against Fake and Replay; (3) deterministic orchestration integration with 8
named synthetic cases; (4) build and content integrity checks including
deterministic rebuild comparison, route verification, base-path scanning,
secret-variable scanning, and schema validation; (5) thin E2E with Playwright
serving the static directory. Normal test commands fail on unexpected network
access. Clear lane ownership model (contract owner, resume owner, governance
owner, replay-data owner, replay-interface owner, portfolio design owner,
integrator, runtime owner, quality owner) with defined folder boundaries.
Import rules enforce module isolation. Full marks.

**B (9/10).** Well-defined test pyramid (unit, integration, contract, E2E) with
a visual diagram. Cross-language contract test (same Run verified in Python and
TypeScript) is a strong and distinctive idea. Live tests quarantined in
`tests/live/` with explicit `RUN_LIVE_TESTS=1` gate. `justfile` for
cross-language orchestration. Module justification table explains why each
package exists separately. Ownership boundaries defined per workstream. Lost 1
point because the testing layers are less granular than A's (no build-integrity
checks, no deterministic-rebuild comparison, no secret-scanning layer) and the
module boundary enforcement is described by convention rather than import rules.

**C (4/10).** Testing is described in four bullet points (unit, integration,
E2E, evaluation strategy). No specific test cases, no module boundary rules, no
ownership model, no network-denial enforcement. The repository structure is
functional but lacks detail on how packages interact or what import rules
prevent leakage. The proposal does not discuss build integrity, content drift
detection, or secret scanning.

### 7 — Security & clean-room compliance

**A (15/15).** Comprehensive threat model covering 12 specific threat
categories: secret disclosure, browser-direct provider calls, prompt injection
and tool abuse, arbitrary code execution, SSRF and exfiltration, cross-site
abuse, cost exhaustion, XSS, replay tampering, supply-chain compromise,
sensitive telemetry, and real data submission. Each threat has specific
mitigations. Clean-room boundary explicitly maintained with a public-source
ledger listing each referenced spec. Synthetic-data boundary uses reserved
domains (`example.invalid`). Secret handling includes CI scanning of emitted
files for secret patterns and known credential strings, server-log redaction,
and explicit prohibition of `NEXT_PUBLIC_*`-style client exposure. The API
accepts no free text — only finite `scenario_id` and `variant` enum — which
eliminates prompt injection and arbitrary data submission by design. Honest
about what Merkle verification does and does not prove (same-origin limitations
stated). Full marks.

**B (13/15).** Threat model as a structured table covering Groq key leak, site
integrity, run integrity, reputation, availability, supply chain, and prompt
injection. CI lint grep for `PUBLIC_.*KEY` patterns is a good practical
control. CSP via `<meta>` tag acknowledges the GitHub Pages limitation.
Clean-room declaration is explicit. Secret boundary diagram is clear. Lost 2
points: (1) the threat model, while adequate, is less comprehensive than A's
(no discussion of SSRF, arbitrary code execution paths, telemetry leakage, or
supply-chain specifics beyond lockfiles); (2) the `POST /api/runs` endpoint
accepts `params?: object` which is an unbounded field — while the threat model
mentions "tools are synthetic no-ops," the API schema should constrain this
more tightly.

**C (7/15).** The secret boundary principle is stated correctly ("the frontend
never possesses the Groq API key"). Clean-room is mentioned. Synthetic data is
stated. But the threat model is three bullet points. The API endpoint
`POST /api/execute` with `{ "intent": string, "context": object }` is an open
surface — an arbitrary `intent` string could carry real PII, prompt injections,
or abusive content to the LLM. This design conflicts with the synthetic-data-only
constraint and the prompt-injection mitigation that A and B achieve through
constrained input. No discussion of CORS, CSP, supply-chain protection,
telemetry sensitivity, or cost-abuse controls. No public-source ledger for
clean-room provenance.

### 8 — Deployment simplicity

**A (5/5).** One clear deploy path: GitHub Actions workflow that checks out,
installs, validates, tests, builds, checks the output, uploads, and deploys
via official Pages actions. Physical routes, `.nojekyll`, `base: "/"`, asset
directory renamed from `_astro` to `assets`. Optional runtime is one OCI
container with portable environment variables. No database, no paid vendor.

**B (5/5).** Concrete GitHub Actions YAML provided. Gotchas table addressing
`.nojekyll`, trailing-slash 404s, SPA deep-link 404s, `basePath` mismatch,
CNAME redirection, asset caching, and fixture file sizes. Optional runtime
Dockerfile provided with specific image, commands, and environment variables.
Multiple deployment target options listed without lock-in.

**C (3/5).** Deployment to GitHub Pages via GitHub Actions is mentioned.
`.nojekyll` is noted. Optional backend can go to "Render or Fly.io" or
"Vercel or Cloudflare Workers." But no workflow YAML, no gotcha analysis, no
Dockerfile, no specific steps. The deployment plan is underspecified.

---

## 3. Hard-Constraint Compliance Audit

### Candidate A

All hard constraints satisfied. Notable compliance measures:

- Root-domain Pages deployment is explicitly configured (`base: "/"`, physical
  routes, `.nojekyll`, no CNAME, asset directory renamed).
- Replay is complete static JSON with logical timestamps; no server dependency.
- Three providers exactly as specified; Groq headers read at runtime.
- Secret flow is explicit; CI scans emitted files.
- Clean-room ledger lists each public spec by name.
- Synthetic-data boundary uses reserved domains and prohibits CV data in
  fixtures.
- The word "production-scale" is explicitly banned in copy.
- No hard-constraint violations found.

### Candidate B

One factual-integrity concern:

- §1 contains the phrase "built agent-governance infrastructure at production
  scale." The CV says "AI Engineering Intern." "Production scale" is an
  inference not present in `cv.yaml`. The proposal's own provenance linter would
  catch this before production. The narrative bullets in §3 are carefully mapped
  to cv.yaml. This is a risk rather than a committed violation, but it must be
  corrected. The full −25 fabrication penalty is not applied because: (a) the
  phrase appears once in a thesis framing section, not in UI copy or demo
  content; (b) the proposal has explicit safeguards against such drift; (c) the
  narrative bullets themselves are accurately sourced.

All other hard constraints satisfied. Notable compliance measures:

- Root-domain Pages deployment configured with Astro `base: '/'` and
  `site: 'https://diegoaleyvag.github.io'`.
- Replay loads `public/runs/*.json` with Web Crypto verification; no server.
- Three providers; Groq headers read dynamically; live tests quarantined.
- CI lint grep for `PUBLIC_.*KEY` patterns.
- Clean-room explicitly stated; only public specs referenced.
- Compliance matrix in §22 cross-references every hard constraint.

### Candidate C

Concerns:

1. **Open API surface.** `POST /api/execute` with `{ "intent": string,
"context": object }` allows arbitrary user input. This conflicts with the
   synthetic-data-only constraint (real PII could be submitted as `intent`) and
   the prompt-injection mitigation that the hard constraints implicitly require.
   This is a design-level concern, not a committed violation, since the API is
   for the optional backend. But if implemented as described, it would create a
   path to real data processing and uncontrolled LLM input.

2. **Framework indecision.** The proposal leaves the framework choice open
   ("Astro or Next.js Static Export" for web, "FastAPI or Hono" for API). This
   is not a hard-constraint violation, but it means the actual static-export
   compatibility, routing behavior, and asset-path handling cannot be verified
   from the proposal alone.

3. **WCAG version.** The proposal targets WCAG 2.1 AA rather than 2.2 AA. Not
   a hard-constraint violation (the hard constraints do not specify a WCAG
   version), but candidates A and B target the current standard.

No hard-constraint violations that would trigger penalties, but the open API
design is a significant structural risk.

---

## 4. Pairwise Comparisons

### A vs. B

A scores 96; B scores 88. Delta: 8 points.

A wins on: technical depth (+1), static/live architecture (+1), governance
design (+3), testing granularity (+1), and security thoroughness (+2). A's
domain model is more precise (event-ordering invariants, approval-binding
semantics, telemetry attribute constraints) and its threat model covers more
attack vectors. A's API contract (scenario + variant enum only) is more
defensible than B's (`params?: object`).

B wins on: MVP feasibility (+2). B's pragmatic decision to hand-author the
first Run JSON rather than building the full governance engine on night one is
the single most realistic scoping call across all three proposals. B also
contributes the recursive-coherence thesis (the portfolio demonstrates its own
governance) and the cross-language contract test idea, both of which are
genuinely valuable.

B's "production scale" phrase is a factual-integrity risk that A explicitly
avoids (A bans words like "production-scale" and "expert" in copy).

**Verdict:** A is stronger overall, but B's pragmatic MVP scoping and
recursive-coherence thesis are worth incorporating.

### A vs. C

A scores 96; C scores 44. Delta: 52 points.

A dominates every category. C's advantages are limited to scope minimalism
(the tonight slice is small enough to ship), but that same minimalism means
it proves little about the architecture. C's open API surface, framework
indecision, and thin governance design are significant weaknesses.

**Verdict:** A is decisively stronger. C contributes no ideas that A does not
already cover better.

### B vs. C

B scores 88; C scores 44. Delta: 44 points.

B dominates comprehensively. B has richer visual directions, a concrete domain
model, a pragmatic MVP plan, a structured test pyramid, a detailed deployment
plan, and a hard-constraint compliance matrix. C is thin across every
dimension.

**Verdict:** B is decisively stronger. The gap is so large that C's only
potential contribution is as a simplicity baseline.

---

## 5. Fatal Flaws per Candidate

### Candidate A

No fatal flaws. The primary risk is scope ambition: the tonight slice
(real Rego decisions, three governance variants, Merkle proofs, browser
verification, Playwright E2E, Pages workflow) may not fully ship in one
evening. But the proposal acknowledges scope cuts and provides a testable
definition of done. This is a velocity risk, not a design flaw.

### Candidate B

1. **Factual-integrity risk.** "Built agent-governance infrastructure at
   production scale" in §1 is an ungrounded characterization. The proposal's
   own safeguards should catch this, but the phrase must be removed from the
   proposal text itself to satisfy the hard constraint that no fabricated
   claims appear "anywhere (docs, UI copy, demo content, or code comments)."

2. **Open API field.** `POST /api/runs` accepts `params?: object` — an
   unbounded field. While less dangerous than C's open `intent` string (B's
   API is scenario-based), this still allows arbitrary JSON through the API
   boundary.

### Candidate C

1. **Open API surface.** `POST /api/execute` with `{ "intent": string }` is
   a path to arbitrary user input, real PII, and prompt injection. This is
   incompatible with the synthetic-data-only constraint.

2. **Governance design is too thin to implement.** Five one-line entity
   definitions, no event vocabulary, no state machine, no approval workflow.
   An implementer would have to design the governance system from scratch.

3. **Framework indecision.** Leaving "Astro or Next.js" and "FastAPI or Hono"
   as open choices means the proposal does not actually resolve any
   architectural question. An architecture proposal that defers architecture
   decisions defeats its own purpose.

4. **No provenance mechanism.** No build-time linter, no source-path mapping,
   no completeness test. The factual-integrity constraint depends entirely on
   human discipline rather than automated enforcement.

---

## 6. Single Best Decision from Each Candidate

### Candidate A — Constrained API contract

The decision to restrict the Live API to `scenario_id` + finite `variant` enum
with no free text is the single strongest security and safety decision in any
proposal. It eliminates prompt injection, arbitrary data submission, and
uncontrolled LLM costs by design rather than by policy. The API constructs all
synthetic input from versioned server assets. This is the correct architecture
for a public-facing endpoint that must maintain the synthetic-data-only
invariant.

### Candidate B — Hand-authored first Run JSON

The pragmatic decision to hand-author the first Run JSON (with valid Ed25519
signature and Merkle root generated by a seed script) rather than building the
full governance engine on night one is the most realistic scoping call. It
proves the architecture end-to-end — static/live boundary, browser-side
cryptographic verification, schema contract — without requiring the complete
execution pipeline. The governance engine follows in session two, building
on a proven contract.

### Candidate C — Minimalism as a forcing function

The tonight slice (one page, one resume, one hardcoded trace) is almost too
minimal, but the underlying instinct — scope ruthlessly to what can actually
ship — is correct. The lesson is not to adopt C's specific scope, but to
recognize that A's ambitious tonight slice benefits from B's and C's pressure
toward pragmatism.

---

## 7. Recommended BASE Proposal

**Candidate A** is the recommended base.

Rationale:

1. Highest score (96) with no penalties and no hard-constraint violations.
2. Most precise and complete governance domain model.
3. Most defensible security posture (constrained API, comprehensive threat
   model, import-rule enforcement).
4. Most thorough testing strategy (5-level pyramid, network denial, build
   integrity checks).
5. Most detailed deployment plan with explicit Pages gotchas.
6. Most careful factual-integrity discipline (explicit ban on "production-scale,"
   "senior," "expert"; source-path references; completeness tests).

A's weakness (ambitious MVP scope) is addressable by incorporating B's
pragmatic scoping strategy (hand-author the first Run JSON, defer the full
engine). A's architecture can absorb this adjustment without structural change.

---

## 8. Decisions That SHOULD Be Combined

These decisions from B would strengthen A's base without contradicting its
architecture:

1. **Hand-authored first Run JSON (from B).** A's tonight slice assumes a
   working Rego-to-WASM compilation pipeline and Fake provider producing real
   runs. B's approach — hand-author the first Run JSON with a seed script for
   Ed25519 and Merkle material — is faster and proves the same architectural
   boundaries. Adopt B's approach for night one; build the full pipeline in
   session two.

2. **Cross-language contract test (from B).** B's idea of feeding the same
   golden Run to both a Python verifier and a TypeScript verifier, and
   asserting both agree on verification results, is a strong testing technique
   that A's framework can accommodate. This applies even if the governance
   engine is TypeScript-only (the test ensures the Run JSON contract is
   truly language-neutral).

3. **Recursive-coherence framing (from B).** B's thesis that the portfolio's
   own provenance system (cv.yaml → claims → traceable source paths) mirrors
   the governance demo's pattern is a genuinely distinctive idea. A's proposal
   already has content provenance (source-path references, completeness tests),
   but framing this as an architectural parallel to the governance demo
   strengthens the narrative without adding implementation complexity.

4. **Explicit compliance matrix (from B).** B's §22 cross-references every
   hard constraint against its specific satisfaction mechanism. A addresses all
   constraints but does not present them as a checkable matrix. Adopting B's
   format improves reviewability.

5. **Visual direction token layer (from B).** B's shared `tokens.css`
   substrate that allows direction-swapping via token-set replacement is a
   practical design-system idea. A recommends Direction A but does not describe
   a token-swap mechanism for future direction changes.

---

## 9. Decisions That MUST NOT Be Combined

1. **C's open API surface (`{ "intent": string }`) must not replace A's
   constrained contract (`scenario_id` + `variant` enum).** The open surface
   breaks the synthetic-data-only invariant and enables prompt injection.

2. **B's `params?: object` field must not be added to A's API contract.**
   An unbounded params object allows arbitrary data through the API boundary.
   If scenario-specific configuration is needed, it should be a typed,
   schema-validated, finite field — not an open object.

3. **C's framework indecision ("Astro or Next.js") must not defer A's Astro
   decision.** A's choice of Astro in static-output mode is well-justified
   (zero-JS default, content-first, no `_next/` confusion, island architecture
   for the Replay explorer). Reopening this choice introduces unnecessary
   risk.

4. **B's two-language split (Python governance-engine + TypeScript site) must
   not replace A's TypeScript-throughout approach without explicit trade-off
   analysis.** B argues Python adds CV credibility; A argues one language
   reduces maintenance. Both are defensible, but combining them by adding a
   Python governance engine to A's TypeScript architecture would double the
   toolchain without a clear winner. The synthesizer must choose one approach,
   not merge both.

5. **C's mocked policy results must not weaken A's real Rego evaluation.**
   Even if the first Run JSON is hand-authored (per B's scoping), the Rego
   policy source and its expected decisions should be real and verified —
   not mocked or simulated. The governance demo's credibility depends on
   real policy logic, even if the execution pipeline is deferred.

---

## 10. Five Hardest Questions the Synthesizer Must Resolve

### 1. TypeScript-only or TypeScript + Python for the governance engine?

A proposes TypeScript throughout (Astro + pnpm workspace + one Preact island).
B proposes TypeScript for the site and browser verifier, Python (Pydantic v2,
FastAPI) for the governance engine and runtime. B argues Python matches Diego's
CV stack and adds credibility; A argues one language reduces maintenance for a
solo developer.

The tension is real: Diego's CV lists Python, Pydantic, FastAPI, SQLAlchemy as
core skills, and using them in the governance engine demonstrates rather than
just claims those skills. But two languages double the toolchain, CI complexity,
and onboarding friction. The synthesizer must decide whether the credibility
gain justifies the maintenance cost, considering this is a long-lived portfolio
project maintained by one person.

### 2. How much governance machinery must work on night one?

A's tonight slice includes real Rego decisions through the Fake provider,
three scenario variants, Merkle proofs, and browser-side verification. B's
tonight slice hand-authors one Run JSON and defers the governance engine
entirely. The gap is large.

The synthesizer must define the minimum governance fidelity for night one that:
(a) proves the architecture is not vaporware, (b) is achievable in a single
evening, and (c) does not require throwaway work that will be replaced by
the real engine. A hand-authored Run JSON with real Ed25519 and Merkle material
(B's approach) may be the pragmatic middle: it proves the verification path
and the schema contract without requiring the full execution pipeline.

### 3. Should Rego compile to WebAssembly for the single-process runtime?

A proposes Rego → WASM to avoid an OPA sidecar and keep one runtime deployable.
B defers WASM as a roadmap item. WASM compilation adds build complexity, a
native/WASM parity testing requirement, and a dependency on OPA's compiler
toolchain.

The synthesizer must decide: is the operational simplicity of one deployable
process (no sidecar) worth the build complexity of WASM compilation, or is it
acceptable to use OPA as a subprocess or library call in the initial runtime?
The static site (Replay mode) does not need WASM at all — it shows recorded
decisions. WASM is only needed for the optional runtime and potentially for
future in-browser re-evaluation.

### 4. Does the portfolio's provenance system formally mirror the governance demo, or are they separate concerns?

B's strongest conceptual contribution is recursive coherence: the portfolio's
own provenance (cv.yaml → claims → auditable source paths) is a micro-instance
of the governance pattern (agent → policy → audit). A has content provenance
(source-path references, completeness tests) but treats it as a content-integrity
mechanism, not as an architectural parallel to the demo.

The synthesizer must decide whether to formalize this parallel (using the same
audit/verification primitives for CV provenance as for governance runs) or to
keep them as separate concerns with coincidental similarity. Formalizing adds
coherence and distinctiveness but risks over-engineering the résumé build
pipeline. Keeping them separate is simpler but misses a differentiating
narrative opportunity.

### 5. What is the correct visual direction and how much design work ships on night one?

All three candidates propose visual directions but none has been implemented.
A recommends Direction A (editorial evidence ledger) and provides the most
specific design tokens. B's three directions are equally detailed but defers
the choice. C's directions are too thin to implement.

The synthesizer must: (a) choose a visual direction (or define decision
criteria for choosing one after the first implementation pass); (b) define the
minimum design work for night one (design tokens, global shell, typography,
responsive layout — or a more minimal unstyled scaffold); and (c) decide
whether to adopt B's `tokens.css` token-swap architecture to allow direction
changes without structural rebuilds. The risk is spending too much time on
visual polish on night one at the expense of the governance architecture that
makes the portfolio distinctive.

---

_Judgement recorded blind. No other proposals' scores, judges' notes, git
history, branch names, worktree contents, or model identifiers were consulted._
