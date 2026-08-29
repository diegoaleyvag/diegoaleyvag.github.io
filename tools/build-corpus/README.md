# Deterministic Ask Diego corpus builder

`corepack pnpm corpus:build` reads every `content/corpus/**/<id>.json` entry
through `@portfolio/ask-corpus`, validates it, canonicalizes field order, and
writes two artifacts in one deterministic pass:

- `apps/site/public/corpus/v1/<id>.json` plus a `manifest.json` lock file
  recording `{ id, path, schemaVersion, byteLength, sha256 }` per entry
  (mirrors `apps/site/public/decisions/v1/`).
- `packages/ask-corpus/generated/corpus-bundle.json` — a single JSON array
  of every canonicalized entry, statically imported by
  `packages/ask-corpus/src/bundle.ts` so `/api/ask` never touches the
  filesystem at request time.

No network, backend, secret, or wall clock is used, and the same source
entries always produce byte-identical output.

The public-artifact write is atomic: bytes land in a sibling temp directory
first, the existing output is moved aside, the temp directory is promoted,
and the backup is discarded only after that succeeds. A validation failure
writes nothing. The generated bundle file is written directly (single file,
same temp-then-rename pattern as `packages/resume/tools/generate-provenance.ts`).

`corepack pnpm generated:check` rebuilds everything in memory and compares it
to both committed outputs without modifying them.
