# AGENTS.md — Global Invariants and Implementation Conventions

These rules apply to every agent and contributor. The architecture tournament
is complete; accepted decisions are binding unless Diego approves a superseding
ADR. Read `docs/architecture.md`, `docs/acceptance-criteria.md`, and the ADRs
relevant to your files before implementation.

## Mission & audience

Build a distinctive personal portfolio, a generated HTML resume, a clean-room
agent-governance & reliability project, and a static-first interactive demo for
the person identified by `name` in `content/source/cv.yaml`, targeting
**recruiters and engineers** evaluating him for junior AI/ML engineering roles.

## Canonical source of truth

`content/source/cv.yaml` is **read-only, canonical fact**. Never rewrite, correct,
embellish, infer, or extrapolate from it. Never fabricate experience, metrics, or
integrations that are not present in it.

Production factual text must come through a typed source path and match the YAML
value exactly. Selection and sequencing are allowed; shortening, paraphrase,
normalization, and LLM-authored factual copy are not. `/resume/` must cover every
publishable source leaf.

## Clean-room requirement

No reuse, paraphrase, or inference of proprietary Infosys code, architecture,
internal documentation, or IP. Reimplement only **public** concepts referenced in
the CV — W3C DIDs/VCs, OPA/Rego, Merkle audit trees, OpenTelemetry — from public
specifications and public documentation only.

Record each implementation source in `content/public-sources/`. Do not use
employer names or CV values in demo package names, scenarios, policies, fixtures,
identities, tools, traces, or tests. If provenance is uncertain, omit the feature.

## Synthetic data only

All new example, demo, scenario, fixture, tool, approval, trace, telemetry, and
test data must be unmistakably synthetic. No real PII, patient data, proprietary
data, or visitor-submitted free text is allowed.

The only personal-content boundary is the existing canonical CV. Its fields may
render directly on portfolio/résumé routes for local validation and builds, but
public deployment of contact and location fields requires owner confirmation.
They must never be copied into demo data, snapshots, logs, telemetry, or
analytics. Pages enforces the reviewed `content/publication-consent.yaml` gate;
agents and CI inputs may not bypass or self-approve it.

## Secrets

No API key may ever reach the browser, a client bundle, or any `NEXT_PUBLIC_*`-style
(or equivalent client-exposed) variable. Keys live only in local or server-side
environment variables. `.env.example` ships with placeholders only; a real `.env`
is never committed.

The static build reads no secret and succeeds without `.env`. Browser code must
not import runtime configuration, server modules, or the Live-Groq adapter.

## Static-first

The public web build MUST be a fully static bundle, deployable to GitHub Pages at
the domain root (`diegoaleyvag.github.io`, no basePath). **Replay mode** must work
with zero backend.

Routes are physical directory output; there is no SSR, rewrite dependency, or SPA
fallback. Required first-slice routes are `/`, `/resume/`, `/lab/replay/`, and
`/404.html`. The artifact root contains `.nojekyll` and no CNAME.

## Provider-neutral runtime

The optional live-inference runtime supports exactly three interchangeable
providers behind one interface:

- **Fake** — deterministic, for tests.
- **Replay** — reads stored JSON runs; powers the zero-backend demo.
- **Live** — Groq, OpenAI-compatible API (first and currently only live provider).

Read Groq rate limits from response headers at runtime; never hardcode them.

Provider selection happens at the runtime composition root; caller code never
branches on provider type. Live is absent from the first public release. If later
enabled, it accepts only a known scenario ID and finite variant—never prompts,
open objects, files, URLs, models, provider names, or user credentials. A
real-provider diagnostic is operational tooling, never a test or merge gate.
Runtime composition defaults to Fake; Live additionally requires the explicit
enablement flag and server key.

## Accepted stack and tooling

- Astro static output and TypeScript.
- Preact only inside the lab island: Replay initially, plus the deferred finite
  Live control only after its runtime/security gates pass.
- A pinned Node.js LTS and pnpm workspace through Corepack.
- ESLint flat config, Prettier for supported web/docs formats, and `opa fmt`
  for Rego.
- TypeScript for governance code and the optional stateless Fastify runtime.
- Rego source tested/evaluated with pinned OPA; in-process OPA WebAssembly is
  deferred to the runtime phase.
- Vitest for deterministic unit/contract/integration tests and Playwright with
  axe-core for static-host E2E and automated accessibility checks.
- No Python application, `uv`, database, queue, CMS, analytics, OPA sidecar,
  general task runner, or build-graph tool initially.

Only the integration owner edits any `package.json` or `pnpm-lock.yaml`. Every
new notable stack/tooling decision needs an ADR under `docs/adr/`.

## Module boundaries

- `apps/site` is browser/static only.
- `apps/runtime` is optional and server-only.
- `packages/contracts` defines closed versioned schemas.
- `packages/governance-core` contains pure domain state transitions, no HTTP,
  environment, filesystem, or provider code.
- `packages/policy-runtime` is the deferred in-process OPA-WASM adapter.
- `packages/providers` contains the provider port plus network-free Fake/Replay.
- `packages/replay` owns bundle loading, canonicalization, and proof checks.
- `packages/resume` owns CV validation, view models, and provenance coverage.
- `packages/testkit` owns fixed clocks, deterministic IDs, and synthetic
  fixture helpers; the replay-data lane owns it for the first slice.
- Generated artifacts are validated at creation and consumption and are never
  hand-edited.

Follow the exclusive folder ownership in `docs/task-graph.md`.

## Evidence language

Browser Merkle verification may claim only that an event matches the root
included in the same replay bundle. It must state beside the result that this
does not prove truth, policy compliance, independent witnessing, or protection
from a compromised origin. Do not use “authentic,” “immutable,” “trustless,”
“verified résumé,” or “compliance proved” for this mechanism.

## Visual direction

Implement only `docs/design-direction.md`: Editorial Evidence Ledger. No
gradients, glass, glow, particles, generic AI imagery, generated portraits, fake
terminals, decorative metrics, autoplay, stock dashboard card grids, or unearned
trust badges. Visual marks must convey provenance, sequence, state,
qualification, hierarchy, or navigation.

## Testing

Normal tests are deterministic, network-free, and secret-free. They use only
Fake, Replay, finite fixtures, and fake HTTP transport around the Live adapter.
CI never calls Groq. Build checks cover CV exactness/coverage, policy behavior,
event ordering, Merkle tampering, generated drift, physical root routes, output
secrets, and browser accessibility.

## Git workflow

Trunk-based development, short-lived branches, [Conventional
Commits](https://www.conventionalcommits.org/). No force-push to `main`. Review
before integrating. Commits must **not** include AI co-author trailers — Diego is
the sole author of record.

## Definition of Done

- Tests pass locally before a task is marked complete.
- Agents touch only the files/areas they own.
- No invented metrics, experience, or integrations — ever.
- No unexpected network, secret, real demo/test data, proprietary material, or
  generated drift.
- Acceptance criteria for the owned lane are demonstrated, not merely asserted.
- Application changes are reviewed through a short-lived pull request.

## Architecture authority

The tournament records in `docs/proposals/` and `docs/judgements/` are historical
inputs. Canonical implementation authority, in order, is:

1. this file and `docs/hard-constraints.md`;
2. accepted ADRs in `docs/adr/`;
3. `docs/architecture.md`;
4. `docs/product-brief.md`, `docs/portfolio-narrative.md`,
   `docs/design-direction.md`, and `docs/threat-model.md`;
5. `docs/acceptance-criteria.md` and `docs/task-graph.md`;
6. scoped `.cursor/rules/*.mdc`.

Do not reopen an accepted decision during implementation. Propose a superseding
ADR when evidence shows a material need. No product name has been selected.
