# Parallel implementation task graph

Status: **Binding ownership plan**

The graph is optimized for a single vertical slice without overlapping edits.
Each task has one owner role, exclusive paths, dependencies, acceptance, and an
explicit no-touch list. Every owner may read the whole repository but may write
only its owned paths.

`content/source/cv.yaml` is read-only for every task.

## 1. Tonight's DAG

```text
T0 -> T1 Contracts
T0 -> T2 Résumé/loader
T0 -> T3 Rego policy
T0 -> T5 Site shell

T1            -> T3 Policy contract binding
T1 + T3       -> T4 Replay bundle
T2 + T5 shell -> T5 Home binding
T1 + T4 + T5  -> T6 Replay UI

T2 + T3 + T4 + T5 + T6 -> T7 Quality
T7                       -> T8 Pages integration
T8                       -> T9 Final slice gate
```

Start T1, T2, T3, and T5's source-independent shell in parallel after T0. T5
cannot complete home-page data binding until T2 freezes and hands off the typed
résumé-loader interface. T4 begins after the contracts and policy input/output
shapes freeze; T3 likewise cannot complete typed policy binding before T1's
policy contract freezes. T6 can build its static shell against the contract
while T4 finishes, but it cannot duplicate fixture data. T7 adds checks
continuously and performs its final pass after all producing lanes.

## 2. Global ownership rules

- Only T0/T8's integration owner edits any `package.json`,
  `pnpm-lock.yaml`, Node pinning, shared TypeScript configuration, or workflow
  permissions. This is an explicit exception to a lane's folder ownership.
- Lane owners submit dependency requests to the integration owner. They do not
  run dependency commands that modify the lockfile.
- Generated artifacts have one producer. Consumers never hand-edit generated
  files.
- A contract change after T1 freeze requires T1 and integration-owner review.
- No owner adds a framework, service, provider, database, product name, visual
  theme, or public factual copy outside the accepted ADRs.
- No task calls Groq or introduces a live test.
- Handoffs identify the schema version, generated-artifact digest, commands
  run, and any acceptance item not yet met.

## 3. T0 — Workspace and toolchain

**Owner:** integration/toolchain owner

**Depends on:** none

**Owns:**

- `/package.json`
- `/pnpm-workspace.yaml`
- `/pnpm-lock.yaml`
- `/.node-version` or the single chosen Node pin file
- `/tsconfig.base.json`
- `/eslint.config.mjs`
- `/.prettierrc.json`
- `/.prettierignore`
- `/.npmrc`
- every workspace `package.json`
- `tools/opa/**` for the pinned release/checksum manifest and verified bootstrap

**Acceptance:**

- Node LTS and pnpm are pinned through repository configuration.
- Frozen installation succeeds from a fresh clone.
- Root scripts expose stable `check`, `build`, `test`, and generated-artifact
  entry points without a task orchestrator.
- The OPA bootstrap verifies the official binary against the pinned
  platform-specific checksum and installs it only into an ignored cache.
- Workspace package names and import boundaries match `docs/architecture.md`.
- No Python, `uv`, Turbo, Nx, `just`, database, or runtime service is added.

**Files not to touch:**

- `content/source/cv.yaml`
- `apps/site/src/**`
- `packages/*/src/**`
- `policies/**`
- `tests/**`
- `docs/proposals/**`
- `docs/judgements/**`

## 4. T1 — Versioned contracts

**Owner:** contract owner

**Depends on:** T0

**Owns:**

- `packages/contracts/**`

**Acceptance:**

- JSON Schemas define `RunBundle`, every event variant, policy input/decision,
  manifests, evidence, trace shape, and deterministic assertion result.
- Schemas reject unknown fields where the contract is closed.
- Types and schemas cannot drift; one declared source generates or derives the
  other.
- Contract fixtures include valid allow/deny shapes and invalid unknown-field,
  sequence, and synthetic-marker cases.
- `schema_version` compatibility rules are documented in-package.

**Files not to touch:**

- any package manifest and the lockfile
- `content/**`
- `apps/**`
- `packages/replay/**`
- `packages/resume/**`
- `policies/**`
- `tests/e2e/**`

## 5. T2 — Canonical résumé and content provenance

**Owner:** résumé/content owner

**Depends on:** T0

**Owns:**

- `packages/resume/**`
- `apps/site/src/pages/resume/**`
- `content/publication-consent.yaml` (create as `pending`; only the repository
  owner may approve)

**May read:** `content/source/cv.yaml`

**Acceptance:**

- Strict validation rejects missing and unknown CV fields.
- The view model preserves source order and exact strings.
- `/resume/` uses semantic HTML and renders every publishable source leaf.
- The lane emits source digest and route/source-path provenance data.
- Coverage tests derive expectations from the source without snapshotting CV
  text.
- Print CSS hooks exist, but no PDF or placeholder link is added.
- The consent file has a closed schema; the lane cannot self-approve it.

**Files not to touch:**

- `content/source/cv.yaml`
- all other `content/**`
- any package manifest and the lockfile
- `apps/site/src/pages/index.astro`
- `apps/site/src/features/replay/**`
- `packages/contracts/**`
- `policies/**`
- `.github/**`

## 6. T3 — Public Rego policy

**Owner:** policy owner

**Depends on:** T0 and T1's frozen policy input/decision contract

**Owns:**

- `policies/source/**`
- `policies/test/**`
- policy package documentation under `policies/**`
- `content/public-sources/**`

**Acceptance:**

- One clean-room capability policy handles `fixture:read` and
  `fixture:adjust`.
- Table-driven OPA tests prove allowed read, missing-capability denial,
  malformed input denial, and unknown action denial.
- Decisions have closed typed values, stable rule IDs, and human-readable
  reasons authored in policy data.
- Public-source ledger entries identify OPA/Rego, RFC 8785, and the selected
  public Merkle construction used by the first slice.
- No employer name, domain model, identifier, or inferred workflow appears.

**Files not to touch:**

- `content/source/cv.yaml`
- any package manifest and the lockfile
- `packages/contracts/**`
- `packages/replay/**`
- `apps/**`
- `policies/compiled/**` until the later WASM task
- `.github/**`

## 7. T4 — Deterministic Replay bundles

**Owner:** replay-data owner

**Depends on:** T1 and T3

**Owns:**

- `content/scenarios/**`
- `packages/replay/**`
- `packages/testkit/**`
- `tools/build-replays/**`
- `apps/site/public/replays/**`

**Acceptance:**

- `synthetic-maintenance-v1` has only `read-allowed` and `adjust-denied`
  variants.
- The builder uses fixed logical time and deterministic identifiers.
- It invokes pinned OPA evaluation and embeds the resulting input, decision,
  reason, source digest, and rule ID.
- Missing, malformed, unknown, or schema-invalid policy output aborts generation
  and writes no artifact.
- It produces schema-valid `RunBundle` files and a manifest.
- The manifest records each bundle's path, versions, variant, exact byte length,
  and SHA-256 digest.
- RFC 8785 canonicalization and RFC 6962-style domain-separated Merkle proofs
  are implemented with independent negative tests.
- Denied output has no tool execution event.
- Regeneration is byte-for-byte stable and committed artifacts are never
  hand-edited.
- All values are visibly synthetic and no CV source value is copied.

**Files not to touch:**

- `content/source/cv.yaml`
- any package manifest and the lockfile
- `packages/contracts/**`
- `policies/**`
- `apps/site/src/**`
- `.github/**`

## 8. T5 — Site shell and chosen design

**Owner:** frontend/design owner

**Depends on:** T0; home-page data binding also depends on T2's frozen loader
interface

**Owns:**

- `apps/site/src/layouts/**`
- `apps/site/src/components/**`
- `apps/site/src/styles/**`
- `apps/site/src/pages/index.astro`
- `apps/site/src/pages/404.astro`
- `apps/site/public/.nojekyll`

**Acceptance:**

- Implements only the Brutalist Editorial direction.
- Home factual values come from the résumé loader via source paths; no copied
  CV prose exists in page files.
- Shell includes skip link, semantic navigation, landmarks, responsive evidence
  rail, footer, visible focus, and reduced-motion handling.
- Home is meaningful with no JavaScript.
- No prohibited anti-slop pattern from `docs/design-direction.md` appears.

**Files not to touch:**

- `content/source/cv.yaml`
- any package manifest and the lockfile
- `apps/site/src/pages/resume/**`
- `apps/site/src/pages/lab/**`
- `apps/site/src/features/replay/**`
- `packages/contracts/**`
- `packages/replay/**`
- `policies/**`
- `.github/**`

## 9. T6 — Replay interface

**Owner:** replay-interface owner

**Depends on:** T1, T4, and T5 shell primitives

**Owns:**

- `apps/site/src/features/replay/**`
- `apps/site/src/pages/lab/replay/**`

**Acceptance:**

- Static HTML explains Replay and both finite outcomes before hydration.
- The route includes the clean-room declaration, public-source references, and
  evidence-limit copy needed for the first release.
- The Preact island loads only a manifest and selected bundle from static
  same-origin paths.
- It verifies the selected bundle's byte length and SHA-256 manifest digest
  before JSON parsing or rendering and fails closed on mismatch.
- Keyboard users can select a variant, step through events, inspect policy
  details and raw JSON, and run the in-memory tamper demonstration.
- Browser verification reports only a match to the included root and displays
  the same-origin limitation beside it.
- The denied variant visibly has no execution event.
- No arbitrary input, autoplay, fake delay, live terminology, server import, or
  external request exists.
- State is conveyed with text and shape as well as color.

**Files not to touch:**

- `content/**`
- any package manifest and the lockfile
- `packages/contracts/**`
- `packages/replay/**`
- `apps/site/src/pages/resume/**`
- shared site primitives except through a T5 handoff
- `policies/**`
- `.github/**`

## 10. T7 — Quality and artifact checks

**Owner:** quality owner

**Depends on:** consumes T1 through T6 incrementally; final pass after all

**Owns:**

- `tests/**`
- `tools/check-content-provenance/**`
- `tools/check-generated/**`
- `tools/check-static-output/**`
- `/vitest.config.ts`
- `/playwright.config.ts`

**Tonight preflight acceptance:**

- Focused tests cover CV leaf coverage, Rego allow/deny,
  denied-without-tool, event order, manifest digest mismatch, and Merkle
  tampering.
- One static-host Playwright flow directly loads the required routes, exercises
  both variants and in-memory tampering, blocks non-local network, and reports
  no serious/critical accessibility violation.

**First-release continuation:**

- Unit/contract tests cover schema rejection, exact CV coverage, event order,
  deterministic IDs, canonical hashing, proof mutations, and deny-without-tool.
- Browser tests serve only the built static directory and enforce a local-origin
  network allowlist.
- E2E covers direct routes, both scenario variants, successful integrity check,
  tamper failure, keyboard operation, and no-JavaScript portfolio/résumé.
- Automated accessibility checks cover every required route.
- Artifact checks detect non-root paths, missing physical routes, absent
  `.nojekyll`, server-only imports, secret-shaped values, CV data in fixtures,
  and generated drift.
- No test directory or command calls a live provider.

**Files not to touch:**

- `content/source/cv.yaml`
- any package manifest and the lockfile
- production module sources
- replay artifacts
- Rego source
- `.github/**`

When a test exposes a production defect, T7 reports it to the owning lane rather
than editing across ownership boundaries.

## 11. T8 — Astro and Pages integration

**Owner:** integration/deployment owner

**Depends on:** T0 and a green T7 tonight preflight

**Owns:**

- `apps/site/astro.config.mjs`
- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`
- root script wiring, manifests, and lockfile changes requested by lanes

**Acceptance:**

- Astro is static-only, directory-format, `base: "/"`, with the exact canonical
  site origin.
- CI installs frozen dependencies, runs the full deterministic gate, builds,
  scans, and uploads exactly one static directory.
- Pull requests never deploy.
- The deployment job fails unless the reviewed publication-consent value is
  `approved`, with no environment or workflow-input bypass.
- Deployment permissions are granted only to the Pages deployment job.
- The uploaded root contains `.nojekyll`, physical routes, and no CNAME.
- Runtime URL/configuration is optional and contains no credential.

**Files not to touch:**

- `content/source/cv.yaml`
- lane-owned production source
- replay JSON by hand
- policy source
- proposal and judgement records

## 12. T9 — Final slice gate

**Owner:** principal integrator/reviewer

**Depends on:** T2 through T8

**Owns:** no feature folder; review and handoff only

**Acceptance:**

- Every checkbox under “Tonight's terminal state” in
  `docs/acceptance-criteria.md` is demonstrated. Remaining first-release
  hardening items are tracked separately and do not expand the night.
- Git diff contains no CV modification, proprietary material, real demo/test
  data, secret, application-scope expansion, or ownership violation.
- Build/test commands and manual accessibility checks are recorded.
- The slice is reviewed in a short-lived pull request before integration.

**Files not to touch:**

- all feature files without a formal handback to their owner
- `content/source/cv.yaml`
- history via force-push

## 13. Deferred tasks

### F1 — Governance engine

**Owner:** governance owner

**Depends on:** T1, T3, and T4 contract feedback

**Owns:** `packages/governance-core/**`, including package-local unit tests

**Acceptance:** state machine, approval binding, tool gate, trace mapping,
deterministic evaluation, and the narrow synthetic DID/VC verification profile
satisfy post-slice criteria. Unsupported suites, remote resolution, bad
signatures, and invalid validity windows fail closed. Malformed runtime policy
output produces a terminal deny/error event and no tool starts.

**Files not to touch:** CV source, site UI, runtime adapter, package manifests,
policy source without policy-owner handoff.

### F2 — Provider implementations

**Owner:** provider owner

**Depends on:** T1 and F1

**Owns:** `packages/providers/**`, including package-local contract tests

**Acceptance:** exactly Fake and Replay are network-free implementations in the
shared package; the Live contract is implemented only by F4's Groq adapter; one
conformance suite covers Fake and Replay.

**Files not to touch:** site, runtime Live adapter, CV source, package manifests,
fixtures outside a replay-owner handoff.

### F3 — Rego WebAssembly

**Owner:** policy-runtime owner

**Depends on:** T3 and F1

**Owns:** `policies/compiled/**` and `packages/policy-runtime/**`

**Acceptance:** reproducible compile, recorded digest, native/WASM fixture
parity, no sidecar, no browser claim.

**Files not to touch:** Rego source without policy-owner handoff, site, CV
source, runtime API.

### F4 — Optional Fastify runtime

**Owner:** runtime/security owner

**Depends on:** F1, F2, and F3

**Owns:** `apps/runtime/**`

**Acceptance:** constrained API, configuration-only provider selection,
server-only Groq secret, response-header quota parsing, redaction, bounded
synthetic tools, OCI portability, and no persistence. Public enablement is still
blocked on F5. The deployment runs non-root with a read-only filesystem and
verified egress restricted to Groq plus an explicitly approved telemetry
endpoint.

**Files not to touch:** site, CV source, shared contracts without contract-owner
review, package manifests/lockfile.

### F5 — Public Live enablement

**Owner:** security/release owner

**Depends on:** F4 plus a completed threat review

**Owns:** the next numbered `docs/adr/*-public-live-enablement.md` and
`docs/runbooks/live-operations.md`. Any deployment-file change is handed to the
integration/deployment owner after this gate passes.

**Acceptance:** the separate ADR explicitly accepts residual cost risk and
verifies kill switch, request/concurrency budgets, source throttling, spend cap,
alerts, exact origins, and operator rollback. Live remains off if any control is
unverified or F6 has not passed.

**Files not to touch:** provider logic, site content, CV source, tests that
would call Groq.

### F6 — Optional browser Live integration

**Owner:** frontend Live-integration owner

**Depends on:** F4 and a handoff from the T6 replay-interface owner

**Owns:** `apps/site/src/features/live/**`

**Acceptance:** the browser discovers only finite capabilities, submits only
the closed scenario request, contains runtime failure to the Live control, and
keeps Replay fully functional when the runtime origin is absent. It exposes no
key, prompt, open parameters, files, URLs, model selector, or provider selector.
Public Live remains off until both F5 and F6 pass.

**Files not to touch:** Replay implementation without T6 handoff, CV source,
runtime code, provider logic, package manifests/lockfile.

### F7 — Optional Typst PDF

**Owner:** résumé-print owner

**Depends on:** T2

**Owns:** `resume/**`, `tools/resume-pdf/**`, and
`apps/site/public/resume/**`

**Acceptance:** direct `cv.yaml` input, source digest, complete field coverage,
reproducible toolchain, no stale fallback, HTML remains canonical.

**Files not to touch:** CV source, HTML résumé without T2 handoff, package
manifests/lockfile, demo data.
