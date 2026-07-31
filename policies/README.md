# Synthetic capability policy

This package is a clean-room policy written from the public OPA/Rego language
documentation. It governs only the fictional, in-memory fixture actions used by
the first replay slice.

Entrypoint: `data.portfolio.capability.decision`

The input and output bind to `PolicyInput` and `PolicyDecision` from
`@portfolio/contracts` schema version `1.0.0`. A valid active agent is allowed
only when its closed capability list contains the capability required by the
selected action. Missing capability, inactive status, malformed input, and an
unknown action return `deny`.

Policy-authored reasons and stable rule IDs live in `source/policy-data.json`.
The malformed/unknown fallback uses the known non-authorizing
`fixture:read`/`fixture:read` pair solely to keep the deny output inside the
closed decision contract; its `capability.input.invalid` rule ID is
authoritative, and no tool may execute after that result.

Run the table-driven cases with `corepack pnpm policy:test`. Replay generation
evaluates this same source with the repository-pinned OPA binary and validates
the result against the TypeScript contract before writing an artifact.
