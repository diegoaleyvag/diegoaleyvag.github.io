# ADR 0006: Make `RunBundle` the replay contract

- Status: Superseded by [ADR 0014](0014-portfolio-product-reset.md)
- Date: 2026-08-01

## Context

Replay must work with no backend, while future Fake, Replay, and Live execution
must produce behavior the same UI can inspect. Separate UI fixtures, engine
objects, and test snapshots would drift and make provider neutrality difficult
to verify.

The first slice also needs to prove a real cross-boundary contract without first
building the complete governance runtime.

## Decision

Define one closed, versioned JSON Schema Draft 2020-12 contract for
`RunBundle`. TypeScript types are generated or derived from that contract, and
a standards-compliant validator checks it at runtime. It is consumed by:

- deterministic replay generation;
- the static Replay explorer;
- browser integrity verification;
- contract and integration tests;
- the future runtime response.

Each bundle includes an explicit synthetic marker, schema/scenario versions,
finite IDs, manifests, policy input/output and digest, ordered logical events,
normalized provider data when applicable, optional trace data, Merkle evidence,
deterministic assertions, generator version, and public-source references.
The replay manifest records each exact bundle's byte length and SHA-256 digest;
consumers verify both before parsing.

For tonight, author one declarative synthetic scenario with allow and deny
variants. A retained deterministic builder evaluates real Rego, validates the
contract, assigns fixed IDs/logical time, and computes evidence. The complete
orchestrator is deferred, but the schema, scenario source, and builder remain
part of the long-term generation path.

Bundles are versioned generated artifacts. They are rebuilt into a temporary
directory and compared byte-for-byte in CI. Consumers never hand-edit them.

## Consequences

- Static and future Live modes converge on one inspectable output shape.
- Schema changes are explicit and versioned; incompatible changes require a new
  major schema path rather than silent fixture rewrites.
- The first slice proves the contract and verification path without throwaway
  mocked UI data.
- Replay never silently falls back to Fake or Live.
- Large secondary fields and bundles can be loaded lazily without changing the
  contract.
