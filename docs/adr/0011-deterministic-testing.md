# ADR 0011: Make normal testing deterministic and network-free

- Status: Accepted
- Date: 2026-08-01

## Context

Governance correctness depends on exact state transitions, policy decisions,
event order, evidence, and content fidelity. Live model output is
nondeterministic, costs money, needs a secret, and cannot be a stable merge gate.
Even a manually gated “live test” would conflict with the provider-neutral test
invariant.

Generated static and replay artifacts can also drift while unit tests remain
green.

## Decision

- Use Vitest for TypeScript unit, contract, and integration suites.
- Use Playwright against the final static directory for E2E, with axe-core for
  automated accessibility checks.
- Unit, integration, contract, accessibility, E2E, and generated-artifact tests
  use only deterministic data, Fake, or Replay.
- Normal test commands fail unexpected network access.
- The Live-Groq adapter is tested through an injected fake HTTP transport, not
  through a fourth provider and not through Groq.
- Policy uses table-driven `opa test`; later native/WASM parity is a merge gate.
- Generated replay bundles are rebuilt into a temporary directory and compared
  with committed outputs.
- Static E2E serves the final directory from a plain local host and allows no
  other origin.
- CV checks validate strict shape, exact rendered values, source-path
  provenance, and complete résumé leaf coverage without copied snapshots.
- Property/negative cases mutate event data, proof siblings, sequence,
  arguments, policy digests, and approval binding as applicable.
- Model-graded evaluations, embedding thresholds, and wall-clock performance
  assertions are not normal correctness tests.
- A real-provider diagnostic, if ever added, is manually invoked operational
  tooling and is excluded from test naming, CI gates, evaluations, and fixture
  updates.

## Consequences

- A fresh clone can validate the project with no secret or backend.
- CI failures are reproducible and do not consume provider quota.
- Live transport handling remains testable across success, malformed data,
  timeout, cancellation, `429`, and `5xx`.
- Artifact, route, content, and secret-boundary regressions become release
  failures rather than deployment surprises.
