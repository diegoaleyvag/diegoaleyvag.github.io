# Canonical architecture

Status: **Accepted and binding**

This document is the implementation authority after the architecture
tournament. Candidate A is the base because both judges ranked it first and
found no hard-constraint violation. The synthesis keeps A's static/live
boundary, constrained API, evidence semantics, and domain rigor; adopts B's
single `RunBundle` contract and ruthless first-slice scope; and uses C only as a
reminder to keep the first delivery small. It does not combine incompatible
stack choices or unsafe API shapes.

## 1. Binding decisions

- The public site is **Astro in static-output mode**, written in TypeScript.
- Portfolio and résumé routes ship no framework JavaScript. The Replay
  explorer is the only initial **Preact island**.
- The repository is a **pnpm workspace** on a pinned Node.js LTS release.
- Versioned JSON Schema is the cross-boundary contract; TypeScript types are
  generated or derived from it and runtime validation uses a standards-compliant
  JSON Schema validator.
- **Vitest** runs unit, contract, and integration tests. **Playwright** plus
  axe-core runs static-host browser and automated accessibility checks.
- ESLint flat config performs TypeScript/Astro correctness linting, Prettier
  formats supported web/docs files, and `opa fmt` formats Rego.
- Governance code and the optional runtime are also TypeScript. The optional
  runtime is one stateless **Fastify** service packaged as one OCI image.
- There is no Python application, database, queue, CMS, analytics service, OPA
  sidecar, or general-purpose task runner in the initial architecture.
  Consequently `uv` is not part of the initial toolchain.
- Rego is authoritative policy source. Tonight, the pinned OPA CLI evaluates
  source policy while replay artifacts are built. The later runtime loads
  reproducibly compiled OPA WebAssembly in-process.
- One versioned, schema-validated `RunBundle` is the contract shared by replay
  generation, the static UI, local integrity checks, and deterministic tests.
- The first public release is Replay-only. Live is a removable, separately
  deployed enhancement and is off unless explicitly configured and approved.
- The visual system is the single **Brutalist Editorial** direction specified
  in `docs/design-direction.md` ([ADR 0013](adr/0013-brutalist-editorial.md)).
- No product name is selected. Neutral labels such as “portfolio,” “lab,”
  “runtime,” and `RunBundle` remain architecture-independent.

## 2. System shape

There are at most two deployables:

1. A complete static directory for GitHub Pages.
2. An optional stateless runtime container for fresh Groq inference.

The first is useful and testable without the second.

```text
content/source/cv.yaml (read-only)
  -> strict résumé loader + source-path provenance
  -> Astro pages
  -> static portfolio and semantic HTML résumé

synthetic scenario + Rego source + fixed clock/IDs
  -> OPA evaluation + deterministic bundle builder
  -> versioned RunBundle JSON + manifest
  -> static Replay explorer
       -> schema validation
       -> event inspection
       -> local Merkle inclusion verification

optional finite browser request
  -> Fastify runtime
       -> governance orchestrator
       -> identity / policy / approval / synthetic tool gates
       -> Fake | Replay | Live-Groq provider port
       -> RunBundle response
```

### Static/live ownership

The static artifact owns all portfolio/résumé HTML, CSS, public-source
references, contracts, replay manifests/bundles, embedded synthetic public
material, recorded policy input/output, event/trace data, deterministic
assertions, Merkle proofs, and browser-safe inspection code.

The optional runtime alone owns the Groq key, fresh provider calls, runtime
configuration, live policy evaluation, bounded orchestration, synthetic tool
execution, upstream quota observations, telemetry export, kill switch, and
abuse controls. A runtime failure affects only a Live control when one is
configured; it cannot affect static navigation or Replay.

## 3. Repository and module boundaries

```text
/
├── apps/
│   ├── site/
│   │   ├── public/
│   │   │   ├── .nojekyll
│   │   │   └── replays/v1/
│   │   └── src/
│   │       ├── pages/
│   │       ├── layouts/
│   │       ├── components/
│   │       ├── features/replay/
│   │       ├── features/live/    # deferred; optional runtime control only
│   │       └── styles/
│   └── runtime/                         # optional; not first-release critical
│       └── src/
│           ├── api/
│           ├── config/
│           ├── orchestration/
│           ├── policy/
│           ├── providers/live-groq.ts  # server-only import boundary
│           ├── tools/
│           └── telemetry/
├── packages/
│   ├── contracts/       # JSON Schemas and generated/derived TS types
│   ├── governance-core/ # pure domain state machine; no HTTP or UI
│   ├── policy-runtime/  # deferred in-process OPA-WASM loader
│   ├── providers/       # provider port plus Fake and Replay
│   ├── replay/          # bundle loading, canonicalization, Merkle verification
│   ├── resume/          # strict CV validation, view model, provenance coverage
│   └── testkit/         # fixed clock, deterministic IDs, synthetic fixtures
├── content/
│   ├── source/cv.yaml   # read-only canonical fact
│   ├── scenarios/       # synthetic declarative scenarios only
│   └── public-sources/  # public-spec provenance ledger
├── policies/
│   ├── source/
│   ├── test/
│   └── compiled/        # reproducible, digest-addressed WASM when runtime lands
├── tools/
│   ├── build-replays/
│   ├── check-content-provenance/
│   ├── check-generated/
│   └── check-static-output/
├── tests/
│   ├── contract/
│   ├── integration/
│   ├── e2e/
│   └── accessibility/
└── .github/workflows/
    ├── ci.yml
    └── pages.yml
```

Import direction is enforced, not merely documented:

- `apps/site` may import browser-safe code from `contracts`, `replay`, and
  `resume`. It must not import `apps/runtime`, the Groq adapter, runtime
  configuration, Node-only modules, or secret names.
- `governance-core` imports contracts only. It has no web framework, filesystem,
  environment-variable, provider, or telemetry-export dependency.
- `policy-runtime` is a deferred adapter around compiled OPA WebAssembly; it
  depends on contracts/policy artifacts and not on HTTP or site code.
- `providers` depends inward on contracts. Fake and Replay are network-free.
- `apps/runtime` is the composition root. It may import contracts, governance
  core, providers, compiled policy, and server-only adapters.
- Generated JSON is validated both when produced and when consumed.
- Only the integration owner edits package manifests and `pnpm-lock.yaml`; lane
  owners request dependencies rather than creating lockfile conflicts.

## 4. Static site and route model

Every public route is emitted as a physical file. No route depends on a rewrite,
SSR, an SPA fallback, or a repository-name base path.

First-slice routes:

- `/` — concise source-grounded profile, selected evidence sequence, résumé and
  lab entry points.
- `/resume/` — complete semantic HTML generated directly from `cv.yaml`.
- `/lab/replay/` — clean-room/evidence explanation plus the hydrated Replay
  explorer.
- `/404.html` — static recovery page with root-correct links.

A later `/method/`, work-detail routes, and known-run summaries may be generated
only from approved source data and checked-in manifests. Unknown dynamic paths
are not supported.

GitHub Pages settings are fixed:

- repository: `diegoaleyvag/diegoaleyvag.github.io`;
- canonical origin: `https://diegoaleyvag.github.io`;
- Astro `output: "static"`, `base: "/"`, directory-format routes;
- root `.nojekyll`; no `CNAME`;
- state in query parameters or URL fragments, never client-only path segments;
- the built directory is tested from `/` with a plain static server.

## 5. Canonical résumé flow

`content/source/cv.yaml` is read-only input. Build code may validate, select,
sequence, and render it, but may not rewrite, normalize, summarize, or enrich
factual values.

The loader:

1. parses the source without writing it;
2. rejects missing and unknown fields against a strict schema;
3. preserves source order and exact UTF-8 strings;
4. exposes facts through typed source paths;
5. renders the full résumé with semantic HTML and print CSS;
6. emits a source digest and route-to-source-path provenance manifest;
7. fails if any publishable leaf is absent from `/resume/`, or if a rendered
   factual string differs from its source leaf.

Editorial order is allowed. Factual shortening and paraphrase are not allowed
in the first release. Neutral interface labels such as “Experience,” “View
résumé,” and “Inspect synthetic replay” are not CV claims and live in a reviewed
copy allowlist. Factual components accept a source path rather than arbitrary
prose.

The repository currently contains no PDF compiler. HTML is therefore the
release-critical résumé. A later Typst PDF pipeline may be added from the same
YAML source, with its own source-digest and completeness checks; no placeholder
or stale PDF is linked tonight.

`content/publication-consent.yaml` is a non-factual release gate with a closed
schema and `contact_fields: pending | approved`. Local validation and static
builds render the canonical source regardless of this flag. The Pages deployment
job refuses to deploy unless the repository owner has changed the reviewed file
to `approved`; no environment variable or CI input bypasses the gate.

## 6. Governance domain

The full domain is intentionally richer than the first slice:

- `AgentManifest`: synthetic identifier, capabilities, credential references,
  tool references, policy-set digest, and status.
- `CredentialEnvelope`: a narrow, versioned W3C VC-shaped profile with embedded
  public verification material. Unsupported suites and remote status checks
  fail closed.
- `ToolManifest`: name/version, argument/result schemas, required capabilities,
  side-effect class, limits, and policy action.
- `PolicyDecision`: `allow`, `deny`, or `needs_approval`, with stable rule IDs
  and authored reasons. At runtime, missing or malformed output becomes a
  terminal deny/error event and no tool starts.
- `ApprovalRequest`: binds agent, tool, canonical argument digest, policy
  digest, action, expiry, and one-time scope. Mismatch, expiry, and replay deny.
- `Run`: scenario, provider-neutral request/result, ordered events, trace,
  evidence, and deterministic evaluation.
- `Trace`: one OpenTelemetry-shaped trace per run, with allowlisted,
  size-bounded metadata only.
- `EvaluationCase`: fixed fixtures and exact structural assertions; no model
  judge, embedding score, or wall-clock threshold.

Policy is checked after identity/capability assessment and immediately before
each tool action. No model output can bypass that gate. Public-demo tools operate
only on in-memory synthetic fixtures; there is no shell, arbitrary code,
filesystem, database, URL fetch, email, or real external effect.

## 7. `RunBundle` contract and evidence

Each versioned generated replay bundle contains:

- `schema_version`, `scenario_version`, and `synthetic: true`;
- scenario and finite variant IDs;
- agent and tool manifests;
- policy source digest, typed input, typed decision, and reason;
- ordered events with sequence numbers and logical timestamps;
- normalized provider result, if inference is part of the scenario;
- optional OpenTelemetry-shaped spans;
- canonical event leaf digests, Merkle root, and inclusion proofs;
- exact deterministic assertions and results;
- generator version and public-source references.

The replay manifest contains the path, schema/scenario version, variant, byte
length, and SHA-256 digest of the exact bytes for each bundle. The browser
verifies the length and digest before parsing or rendering the JSON and fails
closed on mismatch. This whole-bundle check complements the event-level Merkle
proof; both remain same-origin checks with the claim limits below.

Events are canonicalized with RFC 8785 JSON Canonicalization Scheme. The Merkle
construction uses RFC 6962-style domain separation:

- leaf: `SHA-256(0x00 || canonical_event_bytes)`;
- node: `SHA-256(0x01 || left_hash || right_hash)`.

Tree shape follows RFC 6962's largest-power-of-two split; an unpaired final leaf
is not duplicated.

The browser may say:

> Integrity check passed: this event matches the Merkle root included in this
> replay bundle.

It must immediately qualify that statement:

> This demonstrates tamper detection relative to the included root. Because the
> bundle and root are served by the same origin, it does not prove the event is
> true, policy-compliant, independently witnessed, or immune to origin
> compromise.

“Authentic,” “immutable,” “trustless,” “verified résumé,” “compliance proved,”
and equivalent claims are prohibited unless a future design introduces and
documents an independent trust anchor.

## 8. Provider port

There are exactly three provider implementations behind one interface:

- **Fake** — deterministic, keyed by known evaluation-case ID, fixed clock and
  seed, no network.
- **Replay** — loads a schema-validated stored normalized result for a known
  run, no network, no fallback.
- **Live** — a server-only Groq adapter using its OpenAI-compatible API.

The normalized port accepts messages/tool definitions assembled from
server-owned synthetic scenarios plus cancellation, and returns normalized text,
tool-call intents, finish reason, provider/model labels, usage if supplied, and
quota observations. Provider-specific shapes never cross the adapter.

Provider choice occurs once at the runtime composition root through
configuration. Callers do not branch by provider. Tests inject an HTTP transport
into Live; they do not create a fourth provider and never call Groq.

The Live adapter reads rate-limit and retry headers from every Groq response.
Missing or malformed values remain unknown; no provider limit is guessed or
hardcoded. Raw headers and upstream bodies are never forwarded to the browser.

## 9. Optional Live runtime

Live does not ship publicly in the first release. When implemented, the runtime
is one portable Fastify OCI service with no persistence and these endpoints:

- `GET /v1/capabilities` — supported contract/scenario/variant values and
  whether execution is enabled;
- `POST /v1/runs` — exact JSON schema containing only
  `schema_version`, `scenario_id`, and a finite `variant` enum;
- `GET /healthz` — process readiness only; never calls Groq.

The client cannot submit prompts, arbitrary parameters, files, URLs, tool
definitions, models, provider names, or personal data. The server reconstructs
all inputs from versioned synthetic assets.

`POST /v1/runs` returns one complete `RunBundle`; there is no SSE, stored-run
lookup, continuation token, or persistent history. A completed policy denial is
`200`, invalid input is `400`, an oversized body is `413`, throttling is `429`,
disabled/unavailable Live is `503`, and unexpected failure is a generic `500`
with a correlation ID.

Live requires a separate enablement ADR and threat review covering a default-off
kill switch, exact origin allowlist, body/output/time/concurrency limits,
host-level source throttling, configurable request budgets, provider spend cap,
sanitized `Retry-After`, and operator monitoring. CORS is defense in depth, not
abuse prevention. A manual operator diagnostic may call Groq, but it is not a
test, merge gate, evaluation, or golden-fixture updater.

Runtime composition defaults to Fake. Live requires both
`LLM_PROVIDER=live` and `LIVE_EXECUTION_ENABLED=true`; selecting Live without
the explicit enablement flag or without `GROQ_API_KEY` fails closed.

The only browser-visible runtime configuration is an optional public origin.
It is absent by default and may never contain credentials, query tokens, or
secret-shaped values. The site build itself reads no secret and succeeds with
no `.env`.

## 10. Rego execution

Rego source and table-driven `opa test` cases are canonical. Policy packages,
inputs, outputs, and reasons are versioned and digest-addressed.

- Tonight: the replay builder invokes a pinned OPA CLI against checked-in Rego
  and finite synthetic inputs. Embedded decisions are therefore real policy
  outputs, not mocked UI text. Missing, malformed, or schema-invalid output
  aborts generation and writes no replay artifact.
- Runtime phase: CI compiles the same policy to WebAssembly, records the digest,
  and the Fastify process loads it in-process. Native and WASM decisions must
  agree for all policy fixtures before Live can be enabled.
- Browser: Replay displays recorded input/output and digest. It does not claim
  to re-evaluate policy. Browser-side OPA is out of scope until separately
  justified.

This keeps one runtime deployable without making WASM part of tonight's critical
path.

## 11. Tonight's vertical architecture slice

The stop condition is only section 1 of `docs/acceptance-criteria.md`; its
first-release hardening gates do not expand tonight's critical path.

The first slice uses one scenario, `synthetic-maintenance-v1`, with two finite
variants:

1. `read-allowed`: an agent manifest with `fixture:read` requests a read-only
   synthetic asset lookup; real Rego returns allow; the in-memory tool records
   start and completion.
2. `adjust-denied`: the same agent requests `fixture:adjust` without that
   capability; real Rego returns deny; no tool-start or tool-result event exists.

The bundle builder uses fixed logical time and deterministic IDs, evaluates
Rego, validates the bundle schema, and computes the Merkle tree. The browser
renders the events and decision, verifies one inclusion proof, and offers a
clearly labelled in-memory tamper demonstration that must fail. It never mutates
the checked-in artifact.

Tonight explicitly excludes Live, Fastify implementation, Groq, VC signature
verification, approvals, remote DID resolution, OPA-WASM, PDF generation,
OpenTelemetry trace generation/export, database persistence, broad work-detail
routes, analytics, and model-graded evaluation.

## 12. Local development and verification

The default workflow needs Node, pnpm through Corepack, and the pinned OPA CLI.
A repository tool manifest records the official OPA release and per-platform
SHA-256 checksums; a bootstrap command installs the verified binary into an
ignored local tool cache. No backend or secret is required.

Root scripts will provide stable entry points for:

- installation with a frozen lockfile;
- site development in Replay mode;
- deterministic replay generation/checking;
- content/provenance validation;
- policy tests;
- unit, integration, accessibility, and static-host E2E tests;
- static build and artifact checks;
- optional runtime development after that module exists.

Normal tests fail unexpected network access. CI has no Groq secret. Generated
artifacts are rebuilt into a temporary directory and compared with committed
outputs.

## 13. Binding resolutions of the judges' hard questions

The judges posed overlapping five-question sets; these decisions cover every
distinct question.

1. **Language:** TypeScript throughout. Matching a CV technology by adding a
   second runtime language is weaker evidence than a smaller, well-tested
   system. Python and `uv` can be reconsidered only through a superseding ADR
   tied to a concrete need.
2. **Night-one governance fidelity:** one scenario, allow and deny variants,
   real Rego output, ordered events, one inclusion proof, and one failing tamper
   check. The declarative scenario and bundle builder are retained, not
   throwaway scaffolding.
3. **Rego WASM:** yes for the later single-process runtime, with native/WASM
   parity tests; no for tonight and no browser policy claim.
4. **Production strings:** factual values may be selected and sequenced but not
   shortened or paraphrased. Typed source paths, strict schema validation,
   exact-string assertions, and complete leaf coverage on `/resume/` prove
   against inference, upgrading, and omission.
5. **Portfolio/demo provenance relationship:** they share the editorial
   principle “claims lead to inspectable sources,” but not one cryptographic
   mechanism. CV provenance is source-path coverage; run integrity is Merkle
   evidence. The résumé is never presented as cryptographically verified.
6. **Browser claim:** only a match to the included root, with the same-origin
   limitation shown beside it. No truth, authenticity, or compliance claim.
7. **Public Live:** absent from the first release. Later enablement requires the
   finite request schema and operational controls in section 9, plus a separate
   approved ADR. Manual Live diagnostics remain outside testing.
8. **Visual direction:** Brutalist Editorial only ([ADR 0013](adr/0013-brutalist-editorial.md)).
   Implements tokens, shell, typography, responsive evidence rail, accessible
   states, the replay ledger, and a visual Merkle tree; no alternate themes
   or decorative motion beyond the opt-in "Play run" step-through.
