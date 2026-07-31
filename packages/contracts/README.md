# Versioned contracts

`src/schema.ts` is the declared source for the JSON Schema Draft 2020-12
contracts. TypeScript types are derived from those schema objects with
`json-schema-to-ts`; there is no separately authored interface to drift.
`validateRunBundle` and `validateReplayManifest` apply the JSON Schema first and
then enforce cross-record invariants that JSON Schema cannot express, including
contiguous event sequence and deny-without-tool behavior.

## Frozen versions

- `RunBundle.schema_version`: `1.0.0`
- replay manifest `schema_version`: `1.0.0`

Readers accept the exact version they implement. A backward-compatible schema
change increments the minor or patch component, updates the derived types, and
requires an explicit reader update; old closed-schema readers continue to fail
closed. An incompatible change creates a new major schema and static path (for
example, `/replays/v2/`) rather than rewriting v1 artifacts in place.

Generated artifacts are validated both when produced and consumed. Unknown
fields are rejected wherever an object is closed. Intentional maps are modelled
as arrays of closed key/value records so cross-boundary input does not gain an
unbounded object surface.
