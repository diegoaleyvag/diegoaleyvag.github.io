# ADR 0007: Use Rego source with deferred in-process OPA WebAssembly

- Status: Accepted
- Date: 2026-08-01

## Context

The demo must show real policy decisions grounded in public OPA/Rego
documentation. A mocked policy result would not establish that policy logic ran.
At the same time, compiling and loading OPA WebAssembly plus native/WASM parity
testing would make the first-night critical path unnecessarily large.

The later TypeScript runtime needs policy execution without a separate OPA
service.

## Decision

- Checked-in Rego source and table-driven `opa test` cases are authoritative.
- Pin the official OPA CLI release and per-platform SHA-256 checksums in a
  repository tool manifest. Install the verified binary into an ignored local
  cache; do not commit an executable.
- Tonight's replay builder evaluates finite synthetic inputs with native OPA and
  embeds the actual typed decision, reason, rule ID, and source digest.
- During replay generation, missing, malformed, unknown, or schema-invalid
  output aborts the build and writes no artifact.
- At runtime, the same condition becomes a terminal deny/error event and no
  tool starts.
- When the optional runtime is implemented, compile the same source
  reproducibly to OPA WebAssembly and load it in-process through the isolated
  `packages/policy-runtime` adapter.
- Require native/WASM decision parity for every policy fixture before runtime
  release.
- Do not ship an OPA sidecar, user-supplied Rego, or browser policy editor.
- Replay may display recorded policy input/output. It may not claim that the
  browser re-evaluated policy.

## Consequences

- The first slice demonstrates real policy without taking on runtime WASM
  integration.
- The future runtime remains one deployable process and one container.
- OPA toolchain pinning and compiled-artifact drift become CI responsibilities.
- Supporting another policy engine or executing Rego in the browser requires a
  superseding ADR and revised claim language.
