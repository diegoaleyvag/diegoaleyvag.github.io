# Independent architecture proposal: an evidence-first flagship

> “Evidence-first flagship” is a working descriptor, not a product name. This
> proposal deliberately leaves naming open.

## 1. Executive recommendation

Build one static-first product with two reading speeds:

- a recruiter can understand Diego’s profile, selected work, and availability
  without learning the governance system;
- an engineer can inspect the inputs, policy decisions, approvals, traces, and
  audit proofs behind a synthetic governed-agent run.

The unifying product thesis is **claims should lead to inspectable evidence**.
That does not mean cryptographically “proving” CV claims. CV facts remain
ordinary, owner-supplied résumé content. Cryptographic verification applies
only to synthetic governance-demo events and credentials.

The recommended implementation is:

- **Astro in static-output mode** for semantic, mostly server-rendered-at-build
  HTML;
- **TypeScript and a pnpm workspace** for one contract vocabulary across the
  site, replay compiler, and optional runtime;
- **one small Preact island** for the Replay explorer, with no general-purpose
  component library;
- **checked-in, versioned replay bundles** generated deterministically from
  synthetic scenarios, public Rego policies, and the Fake provider;
- **the existing `cv.yaml` to PDF compiler retained** for PDF output, while a
  separate semantic HTML renderer consumes the same YAML;
- **one optional Fastify service**, packaged as an OCI container, for live
  execution;
- exactly **Fake, Replay, and Live-Groq** implementations behind one inference
  provider port;
- Rego compiled to WebAssembly for the optional single-process runtime, rather
  than requiring an OPA sidecar;
- GitHub Pages from `diegoaleyvag/diegoaleyvag.github.io` as the primary public
  deployment, at `/`, with no repository-name base path.

The flagship interaction is not a chatbot. It is a governed-run inspector:
select one of a few explicitly synthetic branches, advance through an
append-only event stream, inspect the policy input and decision, and verify an
audit inclusion proof locally. This is more credible, safer, and more
distinctive than an open prompt box.

## 2. Constraints interpreted as architecture

### Factual boundary

`content/source/cv.yaml` is immutable input. The generator may validate,
select, order, and present its values, but may not correct, enrich, infer, or
rewrite them. In particular:

- the generated résumé renders `name: "Diego Leyva"` as written;
- dates remain source strings rather than being “normalized” into invented
  precise dates;
- portfolio project pages may use only the supplied descriptor, dates, and
  bullets until Diego adds another approved canonical source;
- the clean-room showcase is labelled as a new portfolio demonstration, not as
  an Infosys deliverable;
- words such as “senior,” “production-scale,” “expert,” and unstated impact
  numbers are prohibited.

Every factual content block should carry a build-time source reference such as
`projects[1].bullets[0]`. Those references need not clutter the public UI, but
they make drift reviewable.

### Clean-room boundary

The governance project starts from public specifications and an empty domain
model. It must not reproduce, paraphrase, or infer any employer architecture,
code, naming, workflow, data model, or internal document. The only overlap with
the CV is the set of public concepts explicitly named there.

The repository should maintain a public-source ledger for:

- W3C DID Core;
- W3C Verifiable Credentials Data Model;
- OPA and the Rego language;
- OpenTelemetry trace semantics;
- a public Merkle-tree construction;
- supporting public standards such as Ed25519 and JSON canonicalization.

If provenance is uncertain, omit the feature. Employer names may appear in the
generated résumé because they are canonical CV facts; they must not appear in
demo package names, fixtures, policy names, or architecture prose.

### Synthetic-data boundary

All agents, people, organizations, credentials, tool arguments, prompts,
outputs, traces, approvals, and evaluation cases in the showcase are visibly
synthetic. Reserved domains such as `example.invalid` should be used where a
domain-shaped value is required.

The résumé and portfolio necessarily render the person facts supplied in the
canonical CV because that is an explicit product requirement. Those values
must never be copied into governance fixtures, analytics, telemetry, or tests.
Before public launch, Diego should explicitly confirm publication of the
existing contact and location fields. No new personal data source is permitted.

Replay accepts no user data. The optional Live API also accepts no arbitrary
free text: the browser submits only a scenario identifier and a finite variant
enum, and the server constructs the synthetic prompt. This is the only robust
way to preserve the synthetic-only invariant on a public endpoint.

### Honest evidence

Merkle roots, DID signatures, and evaluation results prove narrowly defined
properties of a demo bundle. They do not prove that a résumé statement is true,
that an event happened in an employer system, or that a compromised web origin
is trustworthy. The UI must state those limits next to the verifier.

## 3. Product thesis, audience, and differentiation

### Thesis

Present Diego as an engineer who connects data work, grounded AI systems, and
agent governance, then let visitors inspect a small system exhibiting those
ideas. The experience should move from **profile**, to **work**, to **governed
run**, to **evidence**.

This is one product, not a portfolio plus a bolted-on dashboard:

- the portfolio establishes the factual narrative;
- the HTML résumé gives complete, searchable source-derived detail;
- the lab explains the clean-room design;
- Replay demonstrates the design with inspectable artifacts;
- the optional runtime executes the same scenario contract through a different
  provider.

### Primary audiences

**Recruiters and hiring managers** need a fast path:

1. exact role target and availability;
2. current education and experience;
3. three selected projects;
4. résumé and contact links;
5. one obvious invitation to inspect the flagship demo.

**Engineers and technical interviewers** need a depth path:

1. domain and trust boundaries;
2. source policy and credential evidence;
3. event-by-event execution;
4. deterministic evaluations and failure cases;
5. repository, tests, public references, and deployment architecture.

### Differentiation

The memorable device is an **evidence ledger**, not AI spectacle. Each page
uses source labels, sequence, and annotations to show where information came
from and what a decision means. The demo exposes denials and malformed cases,
not only a perfect “happy path.”

The system explicitly avoids:

- an oversized slogan followed by a grid of interchangeable cards;
- purple or blue-purple gradients;
- floating glass panels;
- fake terminal output;
- decorative counters or invented reliability metrics;
- an open-ended chatbot that hides all governance behind a spinner;
- claims that a Merkle hash makes content truthful.

## 4. Portfolio narrative, grounded only in `cv.yaml`

The narrative is editorial sequencing, not new biography.

### Opening

Use the source name, headline, location, availability, and summary directly:

- Diego Leyva;
- AI Engineering · Data Science;
- Mexico City, MX;
- Open to remote & relocation;
- the summary exactly as supplied.

The opening should include plain links to the source-provided email, LinkedIn,
GitHub, HTML résumé, and PDF. It should not add a portrait, testimonial,
employer logo, or unsupported tagline.

### Evidence sequence

1. **Education foundation.** Show the BSc Data Science entry at ESCOM –
   Instituto Politécnico Nacional and the Queen Mary University of London
   academic exchange with their exact dates, locations, and details.
2. **Selected project work.** Present Urban Threads, Nutritional Assistant, and
   FridgeGuard using their exact names, descriptors, dates, and bullets.
   Chronology is allowed; an invented case-study process is not.
3. **Current AI engineering experience.** Render the Infosys Limited role,
   programme, dates, location, and bullets verbatim. Do not turn those bullets
   into an inferred employer architecture diagram.
4. **New public showcase.** Introduce the governed-run lab as “a synthetic,
   clean-room portfolio project based on public specifications.” It is current
   site evidence, not another résumé experience entry.
5. **Complete record.** End every abbreviated narrative path at `/resume/`,
   where education, experience, projects, skills, certifications, and contact
   fields are all rendered from the canonical source.

Skills should retain their source categories and strings. Project facts such as
team size, ratings, scores, number of indexes, and event placement may appear
only where the exact source bullet contains them. They should be typeset as
prose evidence, never extracted into decorative “impact metric” tiles.

### Content safeguards

- A build-time provenance manifest maps every rendered claim to a YAML path.
- The résumé has a completeness test covering every YAML leaf intended for
  publication.
- Portfolio summaries are either exact source strings or neutral navigation
  labels; no LLM writes production copy.
- New project detail is blocked until an approved canonical content file is
  added by Diego.
- Demo content uses an unmistakable “Synthetic scenario” label in its heading,
  raw-data view, and downloadable bundle.

## 5. Information architecture and route map

All routes are emitted as physical files with trailing-slash directories. No
route depends on a server rewrite or SPA fallback.

- `/` — the two-speed home page: identity, selected evidence sequence, lab
  invitation, résumé, and contact.
- `/work/` — source-derived index of the role and three projects.
- `/work/fridgeguard/` — only the exact FridgeGuard descriptor, dates, and
  bullets, plus a link to the matching résumé anchor.
- `/work/nutritional-assistant/` — the same constrained treatment.
- `/work/urban-threads/` — the same constrained treatment.
- `/lab/` — clean-room system explanation, public-source ledger, trust
  boundaries, and clear limits of the demonstration.
- `/lab/replay/` — interactive replay selector and event inspector. Scenario
  selection is stored in the URL query or fragment, so the physical route
  remains stable on Pages.
- `/lab/runs/<known-run-id>/` — optional build-generated, shareable,
  pre-rendered summaries for IDs in the replay manifest. Unknown IDs produce no
  route.
- `/resume/` — full semantic HTML résumé generated from `cv.yaml`.
- `/resume/diego-leyva.pdf` — generated convenience download from the existing
  PDF pipeline.
- `/method/` — architecture, deterministic evaluation method, public sources,
  accessibility statement, and clean-room declaration.
- `/404.html` — useful static not-found page with root-relative navigation.

The first release can omit individual work and run-summary pages while keeping
their eventual contracts. The required tonight routes are `/`, `/resume/`, and
`/lab/replay/`.

## 6. Three visual directions

All three directions use custom layout and typography rather than a default
component-library appearance. None uses gradients, glass, fake terminals,
decorative metrics, or cliché AI imagery.

### Direction A — Editorial evidence ledger (recommended)

An off-white reading surface, near-black type, one restrained signal color, and
thin ledger rules. A humanist sans-serif handles navigation and body text; a
serif face gives selected quotations and section openings an editorial voice;
monospace is reserved for hashes, event IDs, and policy paths.

The home page behaves like a concise technical profile spread. Wide screens use
a main narrative column and a narrow evidence margin. Mobile collapses the
margin into labelled disclosure rows. The Replay view becomes an annotated
vertical ledger: event sequence at left, selected evidence in the main pane,
verification status in the margin.

Why it fits: it unifies résumé, portfolio, and audit evidence without pretending
the whole site is software instrumentation. It can be memorable while remaining
quiet enough for recruiters.

### Direction B — Three-city wayfinding

A strong typographic wayfinding system uses the source locations Mexico City,
London, and Bangalore as factual anchors in a chronological route. Project and
education entries are “stops,” not cards. The lab reuses the same visual grammar
for a run route: identity, policy, approval, tool, trace, and evidence.

The palette comes from civic signage—warm white, charcoal, and two flat,
high-contrast route colors. Geography is schematic and labelled, not a
decorative map. Motion is limited to a focus indicator advancing along a route
and is disabled under reduced-motion preferences.

Risk: the travel motif can overtake the engineering story or imply a personal
journey not stated in the source. It must remain a navigation system based only
on explicit locations and dates.

### Direction C — Reliability field manual

The site resembles a carefully typeset field manual: numbered sections,
cross-references, foldout-style diagrams, specimen labels, and approval stamps.
A dark forest neutral, paper white, and safety orange distinguish normal,
attention, and denied states. Illustrations are functional line diagrams of the
public demo model, never robots, brains, sparkles, or generated portraits.

Replay uses side-by-side “observation” and “interpretation” panes, with raw JSON
behind a disclosure. The résumé remains a conventional, highly legible document
within the same typographic system.

Risk: excessive labels can feel theatrical. Every annotation must provide
provenance, state, or navigation value.

### Direction decision

Choose Direction A for the first implementation. It has the lowest risk of
misrepresenting CV facts, the clearest mapping to inspectable run evidence, and
the easiest path to an accessible static HTML résumé. Direction B’s wayfinding
can inform chronology without becoming the governing motif.

## 7. System architecture

### High-level flow

```text
content/source/cv.yaml
        ├── validate and map ──> semantic Astro résumé ──> static HTML
        └── existing compiler ──────────────────────────> generated PDF

synthetic scenario + public Rego + Fake provider + fixed clock
        └── replay compiler ──> versioned RunBundle JSON + manifest
                                     │
                                     └── static Replay explorer

optional browser Live action
        └── constrained scenario request ──> one runtime service
              └── governance orchestrator
                    ├── identity and credential verifier
                    ├── Rego policy engine
                    ├── synthetic tool executor
                    ├── Fake | Replay | Live-Groq provider
                    ├── OpenTelemetry mapping
                    └── evidence and deterministic evaluation builder
```

### Static/live boundary

The static site owns:

- all portfolio and résumé HTML;
- all CSS, icons, fonts, and route metadata;
- the public-source ledger and clean-room declaration;
- versioned JSON Schemas;
- a replay manifest;
- complete, pre-recorded synthetic `RunBundle` JSON files;
- embedded synthetic public DID documents and credentials needed for offline
  inspection;
- policy source text, policy digest, input, and recorded output;
- OpenTelemetry-shaped trace data;
- Merkle root and inclusion paths;
- deterministic evaluation assertions and results;
- browser-side schema, digest, and inclusion-proof verification.

Replay is not a delayed request to a server. Playback timing uses logical event
offsets stored in the bundle and can run instantly in tests.

The optional runtime alone owns:

- the Groq API key;
- live provider HTTP calls;
- provider response headers and quota state;
- server-side configuration;
- live Rego evaluation;
- bounded orchestration and synthetic tool execution;
- server telemetry export;
- app-level abuse controls and the live kill switch.

The static site must build and operate when the runtime URL is absent. If a
public runtime URL is configured but unavailable, the UI reports Live as
unavailable inside the Live control only; Replay and every portfolio route
remain unaffected.

### Replay bundle contents

Each immutable bundle is addressed by a stable synthetic run ID and includes:

- `schema_version` and `scenario_version`;
- an explicit `synthetic: true` marker;
- scenario and variant identifiers;
- agent manifest and public identity material;
- synthetic credential;
- tool manifests and argument schemas;
- exact policy package digest, input, decision, and reason;
- ordered run events with logical timestamps;
- normalized provider result;
- trace and span records;
- canonical audit leaves, Merkle root, and inclusion proofs;
- deterministic evaluation assertions and results;
- generator version and public-source references.

The manifest contains display-safe summaries and a digest for each bundle.
Large raw fields load only after a scenario is selected.

### Replay interactions

The visitor can:

- choose allow, approval, and deny variants;
- play, pause, step, or jump to an event;
- filter by identity, policy, approval, tool, provider, trace, or evaluation;
- compare policy input with its typed decision;
- inspect a synthetic credential and public key;
- verify a selected Merkle inclusion proof locally;
- see which deterministic assertions passed;
- reveal the raw versioned JSON;
- download the synthetic bundle.

The visitor cannot edit policy text and then receive a prerecorded answer. A
future in-browser policy evaluator may add genuine what-if behavior, but the
first release must never disguise lookup as execution.

## 8. Local development architecture

The default local workflow requires no backend and no secret:

1. install the pinned current-LTS Node toolchain and pnpm;
2. run the static site development command;
3. watch `cv.yaml`, scenario sources, policies, and site files;
4. regenerate affected build artifacts in a temporary generated directory;
5. serve the same route shapes used by the Pages output.

Separate commands should exist for:

- static development;
- deterministic replay generation;
- HTML résumé validation;
- the existing PDF build;
- unit, contract, policy, accessibility, and end-to-end tests;
- the optional runtime;
- site plus runtime for local Live testing.

The static command never reads `.env`. The runtime command may read an ignored
local env file. Provider selection occurs at the runtime composition root
through `LLM_PROVIDER=fake|replay|live`; caller code does not change.

Use pnpm workspace scripts rather than adding a task orchestrator on the first
night. Add a build-graph tool only after measured build time justifies it.

## 9. Target repository and module structure

```text
/
├── AGENTS.md
├── content/
│   ├── source/
│   │   └── cv.yaml                    # immutable canonical fact
│   ├── scenarios/                     # synthetic scenario source only
│   └── public-sources/                # spec ledger and provenance metadata
├── apps/
│   ├── site/
│   │   ├── astro.config.mjs
│   │   ├── public/
│   │   │   ├── .nojekyll
│   │   │   ├── assets/
│   │   │   └── replays/v1/            # generated, reviewable bundles
│   │   └── src/
│   │       ├── pages/                  # physical static routes
│   │       ├── layouts/
│   │       ├── components/
│   │       ├── features/replay/        # only hydrated product island
│   │       ├── styles/
│   │       └── content-provenance/
│   └── runtime/
│       ├── src/
│       │   ├── api/
│       │   ├── config/
│       │   ├── orchestration/
│       │   ├── policy/
│       │   ├── providers/
│       │   │   └── live-groq.ts        # server-only import boundary
│       │   ├── tools/                  # synthetic, allowlisted tools
│       │   ├── telemetry/
│       │   └── server.ts
│       ├── test/
│       └── Containerfile
├── packages/
│   ├── contracts/                      # JSON Schema + generated TS types
│   ├── governance-core/                # domain rules; no network or UI
│   ├── providers/                      # port, Fake, and Replay
│   ├── replay/                         # compiler, loader, verifier
│   ├── resume/                         # YAML validation and HTML view model
│   └── testkit/                        # fixed clock, fixtures, HTTP fakes
├── policies/
│   ├── source/                         # public-concept Rego
│   ├── test/
│   └── compiled/                       # reproducibly generated WASM
├── tools/
│   ├── build-replays/
│   ├── check-content-provenance/
│   ├── check-generated/
│   ├── check-static-output/
│   └── resume-pdf/                     # wrapper around existing compiler
├── tests/
│   ├── contract/
│   ├── integration/
│   ├── e2e/
│   ├── accessibility/
│   └── fixtures/                       # synthetic only
├── docs/
│   ├── adr/
│   ├── proposals/
│   ├── references/
│   └── threat-model/
├── .github/workflows/
│   ├── ci.yml
│   ├── pages.yml
│   └── live-smoke-manual.yml
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── .gitignore
```

This is one monorepo and at most two deployables: a static directory and one
optional runtime container. There is no database, queue, OPA sidecar, CMS, or
analytics service in the initial architecture.

Import rules enforce trust boundaries:

- `apps/site` may import contracts, résumé, replay, and browser-safe governance
  helpers;
- it may not import `apps/runtime`, the Groq adapter, Node built-ins, or runtime
  configuration;
- the domain core imports no web framework;
- the runtime depends inward on contracts and domain code;
- generated JSON is validated at both creation and consumption.

## 10. Résumé strategy: one source, two renderers

### Decision

Reuse the existing `cv.yaml` to PDF compile pipeline for the PDF. Generate HTML
separately from `cv.yaml`; never convert the PDF to HTML and never embed the PDF
as the résumé experience.

### Why retain the PDF pipeline

- It already solves print-specific typography and pagination.
- Replacing a working compiler adds risk without improving the canonical
  source model.
- PDF and web have different accessibility and layout requirements.
- The existing pipeline can remain independently testable and downloadable.

The pipeline must first pass a provenance and reproducibility check. Its
toolchain version should be pinned, and CI should invoke it through
`tools/resume-pdf/`. If it cannot run reproducibly on the first night, ship the
complete HTML résumé and omit the PDF link rather than publish a stale,
hand-copied PDF.

### HTML generation

At build time:

1. parse `content/source/cv.yaml` without modifying it;
2. validate it against a strict schema that rejects missing and unknown fields;
3. map it to a typed résumé view model while preserving source order and exact
   strings;
4. render semantic HTML with landmarks, headings, lists, links, and print CSS;
5. emit a source digest and field-coverage manifest;
6. fail the build if an expected field is silently dropped.

Free-form date strings remain visible text. Machine-readable `datetime`
attributes are added only where the source gives an unambiguous value; the
generator must not invent a day or month.

The HTML page is canonical for web access: crawlable, selectable, keyboard
accessible, responsive, printable, and useful with JavaScript disabled. The
PDF is a convenience artifact.

### Drift controls

- A schema fixture proves the current YAML shape is accepted.
- A normalized HTML text snapshot proves exact source strings remain present.
- A field-coverage test accounts for every source leaf.
- The PDF build records the same source SHA-256 in a sidecar build manifest.
- CI fails if a committed PDF, when one is retained, was built from another
  source digest.
- Portfolio excerpts are tested against source paths, not duplicated strings.

Pixel parity between PDF and HTML is explicitly not a goal. Content parity is.

## 11. Governance and reliability domain model

### Agent

An `AgentManifest` has a stable synthetic identifier, display label,
capabilities, allowed credential types, tool references, policy-set digest, and
status. Its identifier may be a synthetic `did:key` or offline-resolved
`did:web` identifier.

Replay never performs network resolution. A synthetic `did:web` document is
embedded with the bundle and points to a reserved invalid domain. The optional
runtime resolves only pre-registered documents or self-contained methods; it
does not fetch arbitrary user-supplied DID URLs.

### Credential

A `CredentialEnvelope` contains the public W3C VC-shaped payload, issuer,
subject, validity bounds, capability claims, proof metadata, and verification
result. Support is intentionally narrow and versioned. Unsupported methods,
proof suites, or remote status URLs fail closed.

Static bundles include public verification material only. Test key material is
explicitly non-secret, isolated from production trust roots, and never reused
outside deterministic fixtures.

### Tool

A `ToolManifest` declares:

- stable name and version;
- description;
- JSON Schema for arguments and result;
- required capabilities;
- side-effect class;
- timeout and output-size safety bounds;
- the policy action used before execution.

Every public-demo tool operates only on an in-memory synthetic fixture. There
is no shell, arbitrary Python, filesystem, database, URL fetch, email, or real
external side effect.

### Policy

A `PolicyBundle` contains source, package name, version, source digest, compiled
artifact digest, declared input schema, and declared decision schema.

A `PolicyDecision` is typed as `allow`, `deny`, or `needs_approval`, with stable
rule identifiers and human-readable reasons authored in policy data. The
orchestrator treats malformed or missing policy output as deny.

Policy is evaluated after identity/credential validation and immediately before
each tool action. Planning output can never bypass the gate.

### Approval

An `ApprovalRequest` binds the exact agent, tool, canonical argument digest,
policy digest, requested action, logical expiry, and one-time scope. An
`ApprovalDecision` records approve or deny, a synthetic approver identifier,
reason, and matching request digest.

An approval for one argument set cannot authorize another. Expired, replayed,
or mismatched approvals fail closed. In the public demo, approvals are
predefined synthetic scenario variants, not claims of real human identity.

### Run and events

A `Run` is an aggregate with scenario, provider-neutral request, status, trace
identifier, ordered events, evidence, and evaluation.

The append-only vocabulary includes:

- run created;
- identity resolved and credential verified;
- policy evaluated;
- approval requested and resolved;
- tool started and completed or blocked;
- inference requested and completed or failed;
- evaluation completed;
- run completed or failed.

Every event has a schema version, run ID, sequence number, logical timestamp,
type, payload, and previous-event reference. Sequence and state-machine
invariants prevent a tool completion from appearing before authorization.

### Trace

One run maps to one OpenTelemetry trace. Identity, policy, approval, tool, and
provider work map to child spans. Span attributes use an allowlist and bounded
values. Prompts, model output, credentials, API keys, tool arguments, email
addresses, and CV content are never placed in telemetry.

Replay bundles contain an OpenTelemetry-shaped export for inspection, not a
claim that a collector received it.

### Audit evidence

Events are canonicalized with a versioned public algorithm. Use domain-separated
hashes: leaf and interior-node encodings differ, following a publicly documented
Merkle construction. The bundle stores the root and inclusion paths.

The browser recomputes the selected leaf and path. A changed event or path must
fail verification. A separately known root is required to make claims against a
compromised origin; because the app and bundle share an origin, the demo
verifier demonstrates integrity mechanics, not immunity to site compromise.

### Evaluation

An `EvaluationCase` specifies fixture versions, exact assertions, integer
weights, and expected terminal state. An `EvaluationResult` lists each
assertion and its pass/fail evidence. No LLM acts as judge in normal tests.

Core domain invariants are:

1. no tool action before identity and policy checks;
2. deny is terminal for that action;
3. approval must bind the exact request;
4. all events are ordered and schema-valid;
5. evidence covers the final event set;
6. telemetry contains only allowlisted attributes;
7. provider failure closes spans and produces a normalized terminal event.

## 12. Provider abstraction

The provider port accepts a normalized inference request plus cancellation and
returns a normalized result. The result includes text, typed tool-call intents,
finish reason, usage only if supplied, provider/model labels, and optional
quota observations. Provider-specific request and response types do not cross
the adapter boundary.

There are exactly three implementations:

### Fake

Deterministic and network-free. It selects a fixture response by evaluation case
ID, uses a fixed clock and seed, and rejects unknown cases. It generates replay
bundles and powers most orchestration tests.

### Replay

Network-free. It loads a schema-validated stored provider result for a known
run and reproduces its logical event order. It never silently falls back to
Fake or Live.

### Live

Server-only. It calls Groq’s OpenAI-compatible API through a small HTTP adapter.
The Groq key is read from a server environment variable at process start and is
never accepted in a request, serialized into an event, logged, returned, or
compiled into the site.

The adapter reads Groq rate-limit and retry headers from every response at
runtime, normalizes their values, and updates server-side quota state. No Groq
limit is hardcoded. Missing or malformed headers are treated as unknown rather
than guessed. Raw upstream headers are not forwarded to the browser.

Provider selection is configuration at the runtime composition root. The
orchestrator never branches on Fake, Replay, or Live. Tests of the Live adapter
mock its HTTP transport; they do not introduce a fourth provider.

Normalized failures include invalid request, timeout, cancellation,
rate-limited, unavailable, malformed provider response, and internal provider
error. Upstream response bodies are redacted before logging or returning.

## 13. Optional Live API contract

The API is intentionally narrow and stateless. It does not expose a general LLM
proxy.

### `GET /v1/capabilities`

Returns supported contract versions, scenario IDs, finite variant enums, and
whether execution is enabled. It does not return keys, account identifiers, raw
quota headers, internal model prompts, or environment details.

### `POST /v1/runs`

Accepts JSON shaped like:

```json
{
  "schema_version": "1",
  "scenario_id": "synthetic-maintenance-v1",
  "variant": "approval-granted"
}
```

The server validates the exact schema, reconstructs all synthetic input from
versioned server assets, executes one bounded run, and returns a `RunBundle`
using the same contract as Replay. The server chooses the provider from
configuration; the client cannot request `live`, choose an arbitrary model,
submit messages, change tools, or provide a URL.

Responses use:

- `200` for a completed governed run, including policy denials;
- `400` for schema or unsupported scenario errors;
- `413` for an oversized body;
- `429` for app-level or provider-level throttling, with a sanitized
  `Retry-After` where known;
- `503` when Live is disabled or the upstream is unavailable;
- a generic `500` with a correlation ID for unexpected failure.

Policy denial is a successful governed outcome, not an HTTP authorization
error.

### `GET /healthz`

Reports process readiness only. It never calls Groq and never exposes secret or
quota state.

The service uses no cookie, browser credential, access token, continuation
token, or persistent run endpoint. CORS allows only the exact Pages origin and
explicit local-development origins. CORS is not treated as an abuse-control
mechanism.

## 14. Threat model and security controls

### Assets and trust boundaries

Protected assets are the Groq key, runtime spend and availability, integrity of
release artifacts, correctness of policy decisions, and visitor trust.

Trust boundaries exist between:

1. repository source and the CI build;
2. static files and the untrusted browser;
3. browser and optional runtime;
4. runtime and Groq;
5. untrusted model output and the orchestrator/tool boundary.

The browser is never trusted merely because it came from the portfolio origin.

### Main threats and mitigations

**Secret disclosure.** Live code is server-only, the site build runs without
the key, environment files are ignored, `.env.example` contains placeholders,
and CI scans emitted files for secret variable names and known credential
patterns. Server logs redact authorization headers and upstream bodies.

**Browser-direct provider calls.** Prohibited. A user-supplied Groq key is also
prohibited because it would exist in browser memory.

**Prompt injection and tool abuse.** Public requests contain no free text.
Prompts and tools are selected from versioned server assets. Tool arguments are
schema-validated, policy-gated immediately before use, and applied only to
in-memory synthetic state. Model-proposed unknown tools or fields fail closed.

**Arbitrary code execution.** No shell, eval, generated Python, plugin loading,
or user-provided Rego exists in the public path.

**SSRF and exfiltration.** The API accepts no URLs. The runtime egress policy
allows only the configured Groq endpoint and optional telemetry endpoint.
`did:web` resolution never follows a user-controlled URL.

**Cross-site abuse.** Exact CORS, JSON-only POST, no cookies, strict body limits,
short timeouts, bounded output, and concurrency caps reduce exposure. Origin
checks do not stop scripts.

**Cost exhaustion.** A public anonymous Live endpoint is inherently abusable;
there is no browser-safe secret that solves this. Live is off by default and
has an operator kill switch, host-level source throttling, configurable
server-side concurrency and request budgets, strict scenario allowlists, and a
provider spend cap. Provider quota behavior is learned from Groq response
headers rather than hardcoded. Public enablement requires a separate reviewed
ADR accepting residual cost risk.

**Cross-site scripting.** Model and fixture strings render as text. If Markdown
is later allowed, it passes through a strict sanitizer with raw HTML and unsafe
URLs disabled. Raw JSON uses text nodes, not HTML injection.

**Replay tampering.** Schemas, digests, and Merkle proofs detect corruption
relative to the loaded manifest. Release checksums published through a separate
Git commit/release provide an external comparison point. The UI does not call
same-origin signatures an absolute trust anchor.

**Supply-chain compromise.** Use a frozen lockfile, minimal dependencies,
pinned CI action revisions, dependency review, reproducible generated
artifacts, and least-privilege Pages workflow permissions.

**Sensitive telemetry.** Attribute allowlists exclude all prompt, output,
credential, contact, and tool-payload content. No analytics script is present
tonight. Optional exporters are server-side configuration only.

**Real data submission.** Replay has no input. Live accepts enums only. Tool
state, approvers, credentials, and outputs are synthetic. This is enforced by
API schema, not just UI copy.

## 15. Deterministic evaluation and test pyramid

Normal test commands must fail any unexpected network access and never call
Groq. CI contains no Groq secret.

### Level 1 — domain and rendering unit tests

The largest layer covers:

- CV schema acceptance and rejection;
- exact résumé field coverage and HTML escaping;
- event state-machine transitions;
- credential validity boundaries with a fixed clock;
- tool argument validation;
- approval binding, expiry, mismatch, and replay;
- canonical event hashing;
- Merkle root and inclusion-proof verification;
- telemetry attribute allowlists;
- Fake provider determinism;
- Replay provider schema and digest checks;
- error normalization.

Property tests should mutate an event, proof sibling, sequence number, approval
argument, or policy digest and assert failure.

### Level 2 — policy and provider contract tests

- `opa test` runs table-driven Rego cases.
- The compiled WebAssembly decision is compared with native OPA output for the
  same fixtures.
- One provider conformance suite runs against Fake and Replay.
- Live-Groq is tested through a fake HTTP transport with successful, malformed,
  timeout, cancellation, `429`, and `5xx` responses.
- Header fixtures prove quota state comes from response headers and that absent
  headers remain unknown.

No test swaps in a “mock provider”; that would create a fourth implementation.

### Level 3 — deterministic orchestration integration

Generate and assert complete runs for at least these synthetic cases:

1. valid credential plus low-risk read is allowed;
2. missing capability is denied before tool execution;
3. a side-effecting synthetic action requests approval;
4. a mismatched approval is denied;
5. a correctly scoped synthetic approval permits the simulated action;
6. malformed provider tool output is rejected;
7. a provider timeout closes spans and produces a terminal failure event;
8. a changed audit event fails inclusion verification.

Each case has exact structural assertions. A weighted score, if displayed, is
integer arithmetic over those assertions. There is no probabilistic model
grader, embedding similarity threshold, or wall-clock latency assertion.

### Level 4 — build and content integrity

- regenerate replay bundles into a temporary directory and compare them with
  committed artifacts;
- build the static site twice and compare deterministic HTML/JSON/assets;
- assert every route has a physical output file;
- crawl all internal links from `/`;
- assert no repository-name base path appears;
- assert the runtime URL is optional;
- scan built JavaScript and source maps for server-only imports and secret
  identifiers;
- verify résumé and PDF source digests;
- validate every replay bundle against its versioned schema.

If the existing PDF tool emits nondeterministic metadata, normalize or exclude
that metadata from comparison; do not pretend byte-for-byte reproducibility.

### Level 5 — thin end-to-end layer

Playwright serves the built directory as a plain static host and verifies:

- direct loading of `/`, `/resume/`, and `/lab/replay/`;
- keyboard-only replay selection and stepping;
- an allow and deny branch;
- local Merkle verification and tamper failure;
- useful no-JavaScript portfolio and résumé content;
- the configured 404 page;
- no external network request during Replay.

Run automated accessibility checks plus targeted manual checks. Browser tests
use Replay only.

### Live diagnostics

A separately named, manually dispatched workflow may exercise Groq after an
operator approval. It is never part of the normal test command, merge gate, or
deterministic evaluation score. Its output is operational diagnostics, not a
golden test update.

## 16. GitHub Pages deployment

The primary repository is exactly
`diegoaleyvag/diegoaleyvag.github.io`, producing the root site
`https://diegoaleyvag.github.io/`.

### Site configuration

- Astro output mode is static.
- The canonical site URL is the user-root URL.
- Base is `/`; no repository name is prepended.
- Routes emit `directory/index.html`.
- Internal links use root-correct URL construction.
- Interactive state uses query parameters or fragments, not client-only paths.
- The default Astro `_astro` asset directory is changed to `assets` to avoid
  underscore handling surprises.
- A root `.nojekyll` file is emitted anyway, protecting future underscore
  assets and making the no-Jekyll intent explicit.
- There is no `CNAME` unless a custom domain is deliberately added later.

### Pages workflow

On reviewed changes merged to `main`, one GitHub Actions workflow:

1. checks out the exact commit;
2. installs the pinned Node and pnpm toolchain with a frozen lockfile;
3. validates CV, public-source ledger, schemas, policy tests, and generated
   replay artifacts;
4. runs deterministic tests and the static end-to-end suite;
5. invokes the existing pinned PDF compiler;
6. builds `apps/site` to one static output directory;
7. checks physical routes, root links, `.nojekyll`, asset paths, and secret
   absence;
8. uploads that directory with the official Pages artifact action;
9. deploys with the official Pages deployment action.

The workflow receives Pages and OIDC permissions only where required by the
deployment job. Pull-request builds do not deploy. No runtime environment,
database, server function, or paid vendor is required.

The final pre-deploy check serves the artifact at `/`, not under a simulated
repository subpath. This catches accidental `/<repo>/` assumptions.

## 17. Optional backend deployment

Package `apps/runtime` as one minimal OCI image containing:

- the Fastify application;
- compiled JavaScript;
- versioned scenario assets;
- compiled Rego WebAssembly;
- no site assets and no PDF toolchain.

The reference deployment may use a managed scale-to-zero container platform
such as Cloud Run, but the image, HTTP contract, and environment variables are
portable. There is no platform SDK in domain code and no database.

Server configuration includes:

- `LLM_PROVIDER`;
- server-only `GROQ_API_KEY` when provider is Live;
- server-selected Groq model;
- exact allowed origins;
- execution kill switch;
- configurable request, concurrency, and output safety budgets;
- optional server-side OpenTelemetry exporter endpoint.

Secrets come from the platform secret store and enter only the server process
environment. Startup fails closed if Live is selected without its key. The
static site receives only a non-secret public runtime base URL. Removing that
URL or the whole service leaves Replay intact.

Deploy the runtime independently from Pages. A runtime failure must not block a
site deployment. No persistent prompt, result, approval, or trace storage is
introduced; operational logs contain identifiers and allowlisted metadata only.

## 18. Accessibility requirements

The release target is WCAG 2.2 AA, tested rather than asserted.

- One logical heading hierarchy and landmark structure per page.
- Skip link, visible focus, and full keyboard operation.
- Native buttons, lists, tables only for genuinely tabular data, and
  disclosures; no clickable `div` controls.
- Replay has a text event list and details pane, not a canvas-only
  visualization.
- Event state is conveyed by label and icon shape as well as color.
- Playback never auto-starts with motion, can be paused, and respects
  `prefers-reduced-motion`.
- Verification updates use a restrained live region without repeatedly
  interrupting screen readers.
- Raw hashes wrap and remain selectable; abbreviated visual hashes preserve an
  accessible full value.
- Touch targets and focus order remain usable at narrow widths and zoom up to
  400%.
- Contrast is checked for every state, including denied, disabled, and focus.
- The HTML résumé is fully usable without JavaScript and has deliberate print
  styles.
- Font loading never hides text; self-hosted, subset fonts are optional, with
  strong system fallbacks.
- Language metadata is explicit. Source strings, including accented names, are
  preserved as UTF-8.

Automated checks are necessary but not sufficient. Manual keyboard,
screen-reader smoke, zoom, reduced-motion, and print-preview checks are release
gates.

## 19. Performance requirements

The home and résumé routes should ship no client framework JavaScript. Hydrate
only the Replay explorer when it enters the page.

Initial budgets:

- no third-party scripts or client analytics;
- at most two self-hosted font files, aggressively subset, or system fonts;
- home-page first-party JavaScript no more than 30 KB compressed;
- Replay route first-party JavaScript no more than 120 KB compressed before a
  selected raw bundle;
- lazy-load raw JSON, policy source, and secondary run bundles;
- compressed individual replay bundles kept reviewably small, with CI warning
  thresholds;
- responsive images with explicit dimensions;
- no layout shift caused by fonts or replay hydration;
- target Core Web Vitals “good” thresholds on a representative mobile profile.

These are release requirements, not claimed measured results. Budgets should be
adjusted only with an ADR and before/after measurements.

Static HTML includes the lab explanation and selected scenario summary, so the
route remains meaningful before hydration. Content-hashed assets receive long
cache lifetimes; HTML and the replay manifest use revalidation-friendly cache
behavior supplied by Pages.

## 20. Smallest credible vertical slice shippable tonight

Tonight’s slice should prove the architecture end to end, not scaffold every
future route.

### Ship

1. Direction A’s design tokens, global shell, keyboard navigation, and
   responsive layout.
2. `/` with source-derived identity, summary, one concise evidence sequence,
   résumé link, lab link, and source-provided contact links.
3. `/resume/` generated as semantic HTML from every current `cv.yaml` section.
4. A PDF generated by the existing pipeline if its pinned build succeeds; no
   stale fallback.
5. `/lab/replay/` with one synthetic maintenance scenario and three
   deterministic variants: allowed read, approval-granted simulated action,
   and missing-capability denial.
6. Real build-time Rego decisions, Fake-provider output, ordered events, one
   trace, a Merkle root, and at least one browser-verifiable inclusion proof.
7. Clear Replay, synthetic-data, clean-room, and evidence-limit labels.
8. Unit tests for résumé coverage, policy outcomes, event order, and Merkle
   tampering.
9. One static Playwright flow and automated accessibility scan.
10. A Pages workflow producing a root-hosted static artifact with `.nojekyll`.

The replay UI can use a simple event list plus details pane. It does not need a
graph editor, animated topology, streaming text, or generic JSON workbench.

### Definition of tonight-done

- A fresh clone builds without a backend or secret.
- The three required routes load directly from a plain static server.
- Every résumé value comes from `cv.yaml`.
- Every demo value is synthetic.
- A denied run visibly executes no tool.
- Tampering with the selected audit event makes verification fail.
- Tests make no network calls.
- The Pages artifact contains no server code or secret-shaped configuration.

## 21. Explicit non-goals for tonight

- Deploying or publicly enabling Live-Groq.
- Accepting arbitrary prompts, files, URLs, or personal data.
- A database, user accounts, sessions, persistent approvals, or run history.
- Remote `did:web` resolution or broad DID/VC suite compatibility.
- A browser Rego editor or simulated “what-if” answers.
- Real external tools, shell execution, RAG, vector search, or code execution.
- Recreating any employer system or using any employer artifact.
- Replacing or redesigning the existing PDF compiler.
- Rich case studies unsupported by the canonical CV.
- Completing every future work-detail and run-summary route.
- Analytics, a CMS, comments, a blog, localization, or a custom domain.
- Model-graded evaluations or live inference in CI.
- A polished public abuse-control posture for anonymous Live; public Live stays
  disabled until separately reviewed.

## 22. Parallel implementation task DAG and ownership

One owner controls each folder. The integrator alone edits root workspace
manifests and the lockfile; lane owners request dependency changes to avoid
merge collisions. Nobody edits `content/source/cv.yaml`.

### DAG

```text
A. Contracts and invariants
├──> B. Résumé pipeline ────────────────┐
├──> C. Governance core ─> D. Replays ─> E. Replay UI ─┐
└──> F. Site shell and narrative ───────────────────────┤
                                                       ├──> G. Static integration
C. Governance core ─> H. Optional runtime              │       and Pages
                                                       └──> I. Final QA
```

### Lane ownership

**A — Contract owner**

- Owns `packages/contracts/` and schema-version policy.
- Defines RunBundle, events, scenario request, policy decision, trace, evidence,
  and evaluation schemas.
- Finishes first; changes after freeze require integrator review.

**B — Résumé owner**

- Owns `packages/resume/`, `tools/resume-pdf/`, and
  `apps/site/src/pages/resume/`.
- Builds strict YAML validation, semantic rendering, coverage manifest, and PDF
  wrapper.
- May read but never modify `content/source/cv.yaml`.

**C — Governance owner**

- Owns `packages/governance-core/` and `policies/`.
- Implements the state machine, policy input/output, approval binding, event
  hashing, trace mapping, and deterministic evaluation.
- Uses only entries approved in the public-source ledger.

**D — Replay-data owner**

- Owns `content/scenarios/`, `packages/replay/`,
  `tools/build-replays/`, and `apps/site/public/replays/`.
- Authors only synthetic fixtures and produces reproducible bundles.
- Depends on A and C.

**E — Replay-interface owner**

- Owns `apps/site/src/features/replay/` and lab route components.
- Implements accessible selection, stepping, filtering, raw inspection, and
  local proof verification.
- Consumes contracts; does not redefine them.

**F — Portfolio design owner**

- Owns `apps/site/src/layouts/`, `components/`, `styles/`, the home route, and
  source-derived work views.
- Implements Direction A without adding claims or demo data.

**G — Integrator and deployment owner**

- Owns root workspace files, `apps/site/astro.config.mjs`,
  `tools/check-static-output/`, and `.github/workflows/pages.yml`.
- Resolves dependency requests, assembles routes, verifies the root path, and
  produces the Pages artifact.

**H — Runtime owner, optional and non-blocking**

- Owns `apps/runtime/`.
- Implements Fastify composition, Live-Groq, Rego WASM loading, constrained
  API, redaction, and runtime configuration.
- Starts after A and C; cannot block the static launch.

**I — Quality owner**

- Owns `tests/` and `.github/workflows/ci.yml`.
- Adds network denial, provider contract tests, static E2E, accessibility, and
  generated-artifact drift checks.
- Reviews outputs from all lanes but does not edit their owned folders without
  handoff.

For tonight, run A, B, C, and F in parallel; D follows A+C; E follows A+D; G
integrates B+E+F; I validates continuously and performs the final static-host
pass. H is deferred.

## 23. Risks and trade-offs

### Astro plus a Preact island

This preserves static HTML and a small interactive boundary, but introduces two
component models. Mitigation: Preact exists only under
`features/replay`; all content and layout stay in Astro.

### Two résumé renderers

HTML and PDF can drift in presentation or field coverage. Mitigation: both read
the same immutable source, share a source digest, and have explicit completeness
checks. They do not share layout code because their media requirements differ.

### Replay can be mistaken for live execution

Animation can create a false impression. Mitigation: persistent Replay labels,
logical-time controls, a raw bundle view, and no fake typing indicator. Live has
a separately styled state and appears only when a runtime is configured.

### Integrity can be overclaimed

A Merkle proof served with its own root does not defeat a compromised origin.
Mitigation: narrow explanatory copy and externally comparable release
checksums. Never use “immutable,” “verified résumé,” or “trustless” without the
required trust qualification.

### OPA WebAssembly adds build complexity

It avoids a sidecar and keeps one runtime deployable, but native and WASM
behavior must remain aligned. Mitigation: compile from checked-in Rego, pin OPA,
record artifact digests, and compare native and WASM decisions in CI.

### Static cryptographic verification can grow the bundle

Shipping a broad DID/VC stack would hurt performance and increase supply-chain
surface. Mitigation: support a narrow, declared fixture profile and lazy-load
verification code on the Replay route.

### Public Live is a cost-abuse surface

Origin checks cannot protect an anonymous endpoint. Mitigation: no arbitrary
input, strict scenario allowlist, server-side budgets, provider quota headers,
spend cap, kill switch, and default-off deployment. Residual risk remains and
must be accepted explicitly.

### Contact data and the synthetic-only wording

The mission requires publishing a résumé whose canonical source contains
contact and location fields, while the global data rule rejects real PII in
examples and tests. This proposal resolves the practical conflict narrowly:
canonical résumé fields are rendered only as résumé/portfolio content; every
new fixture and all telemetry are synthetic or content-free. Diego should
confirm public contact-field publication before launch rather than letting an
implementation silently choose.

### Thin source material for case studies

The YAML bullets cannot support invented problem/process/outcome narratives.
Mitigation: use concise source-derived work pages now and add depth only from a
future owner-approved canonical source.

### Existing PDF pipeline may not be CI-ready

Its dependencies or output metadata may be unpinned. Mitigation: wrap and
verify, do not rewrite tonight. HTML remains the release-critical résumé.

## 24. Rejected alternatives

### SSR-first full-stack framework

Rejected because the public product does not need request-time rendering and
must be trivially deployable to root GitHub Pages. A static export mode inside
an SSR-first framework adds configuration paths that can accidentally depend on
server behavior.

### Single-page application

Rejected because direct routes, no-JavaScript résumé content, crawlability,
print behavior, and Pages 404 behavior are first-class requirements. The demo
does not justify hydrating the entire portfolio.

### PDF iframe or PDF-to-HTML conversion

Rejected because it makes the résumé decorative, inaccessible, and prone to
drift. Structured HTML must be generated directly from YAML.

### Replacing the PDF pipeline

Rejected for the first release because a working print compiler already exists.
Reimplementation adds risk and no product differentiation.

### Browser-direct Groq or visitor-supplied key

Rejected because both put a secret in the browser. Obfuscation, local storage,
and client-exposed environment variables do not change that.

### Open chat input

Rejected because it permits real PII, prompt injection, uncontrolled costs, and
unbounded evaluation. Finite synthetic scenarios better demonstrate governance.

### Database-backed run history

Rejected because Replay is complete static JSON and the first Live contract can
be stateless. Persistence would add privacy, retention, migration, and
operations work without improving tonight’s evidence.

### Multiple runtime services or an OPA sidecar

Rejected as needless operational complexity. Rego WebAssembly keeps policy in
the one optional runtime process.

### Browser policy “simulation”

Rejected unless the browser actually evaluates Rego. Selecting prerecorded
branches is honestly called Replay; it must not be presented as editable
execution.

### LLM-as-judge evaluation

Rejected for normal tests because it is nondeterministic, costly, provider
dependent, and difficult to audit. Exact structural assertions are stronger for
governance invariants.

### Generic dashboard or fake terminal visual language

Rejected because it obscures the human portfolio, encourages decorative
metrics, and is indistinguishable from stock AI landing pages.

## 25. ADRs to create after synthesis

Notable decisions must be recorded before implementation lands:

1. **Static web stack:** Astro static output, pnpm, and one isolated Preact
   island.
2. **Root Pages routing:** physical routes, trailing slashes, `base: "/"`,
   `assets` directory, and `.nojekyll`.
3. **Canonical CV rendering:** immutable YAML, strict schema, separate semantic
   HTML renderer, retained PDF compiler, and parity checks.
4. **Content provenance:** source-path manifest and prohibition on generated
   factual copy.
5. **Clean-room method:** public-source ledger, review checklist, and omission
   rule.
6. **Synthetic scenario policy:** no free text, reserved identifiers, no real
   side effects, and no CV data in fixtures.
7. **RunBundle contract:** schema versioning, event vocabulary, canonicalization,
   and migration policy.
8. **Audit construction and claim limits:** Merkle algorithm, external-root
   assumptions, and UI wording.
9. **Provider port:** exactly Fake, Replay, and Live-Groq; transport mocking
   strategy; provider-neutral errors.
10. **Policy execution:** Rego source, pinned OPA compiler, WebAssembly runtime,
    and native/WASM parity tests.
11. **Optional runtime:** one stateless Fastify OCI service, no database, strict
    scenario API, and server-only secrets.
12. **Anonymous Live risk:** default-off posture, budgets, spend cap, rate-header
    handling, and kill switch.
13. **Telemetry minimization:** OpenTelemetry span model and attribute
    allowlist.
14. **Accessibility and performance budgets:** release gates and exception
    process.
15. **Visual direction:** final tokens and typography after Direction A is
    validated with representative résumé and Replay content.

## 26. Naming criteria and collision risk

Do not select a final name during implementation tonight. Use neutral internal
labels such as `site`, `lab`, `runtime`, and `RunBundle`.

A future name should:

- be pronounceable in both Spanish and English;
- connect evidence, governed action, or inspectable runs without claiming
  absolute trust;
- work for a personal portfolio and a technical lab;
- avoid “AI,” “GPT,” “copilot,” “agent OS,” and generic “trust platform”
  constructions;
- avoid confusion with W3C, OPA, OpenTelemetry, Groq, Infosys, or any employer;
- remain readable in a URL and when spoken;
- not require an unexplained acronym;
- permit a restrained visual identity rather than dictate robot or shield
  iconography.

Collision risk is high around words such as “agent,” “trust,” “proof,”
“ledger,” “trace,” and “guard.” “DID” also collides semantically with the
standard and is awkward in speech. A name containing “verified” or “proof”
could create a legal and product-truth problem by implying verified employment
or cryptographic truth.

Before selecting a name, check:

- exact and confusingly similar web search results;
- GitHub repositories and organizations;
- npm and PyPI packages;
- relevant domain and social-handle availability;
- USPTO, EUIPO/TMview, and WIPO trademark databases;
- pronunciation, spelling, and unintended meaning in Spanish and English;
- similarly named security, identity, observability, and AI products.

Domain availability alone is not clearance. Record the shortlist, checks, date,
and final rationale in the naming ADR; keep the architecture independent of the
result.

## 27. Final constraint audit

This proposal keeps the public site fully static and root-deployable, makes
Replay complete with zero backend, treats Live as removable, defines exactly
three provider implementations, reads Groq limits from response headers, and
keeps every key server-side.

It leaves `cv.yaml` untouched, generates structured HTML directly from it,
retains the existing PDF path without making PDF canonical, uses only public
governance concepts, excludes employer-derived architecture, and confines all
new demo/test data to explicit synthetic fixtures.

The first release requires no database, paid host, live inference, user account,
or hidden server behavior. Its central promise is deliberately narrow: a
distinctive, factual portfolio and an inspectable demonstration of how a
synthetic agent action can be identified, governed, traced, evaluated, and
audited.
