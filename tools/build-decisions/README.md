# Deterministic Five Decisions registry builder

`corepack pnpm decisions:build` reads every `content/decisions/<id>/portfolio.project.json`
manifest through `@portfolio/decisions`, validates it, canonicalizes field
order, and writes `apps/site/public/decisions/v1/<id>.json` plus a
`manifest.json` lock file recording `{ id, path, schemaVersion, byteLength,
sha256 }` per entry. No network, backend, secret, or wall clock is used, and
the same source manifests always produce byte-identical output.

The write is atomic: bytes land in a sibling temp directory first, the
existing output is moved aside, the temp directory is promoted, and the
backup is discarded only after that succeeds. A validation failure writes
nothing.

`corepack pnpm generated:check` rebuilds everything in memory and compares it
to the committed directory without modifying it.
