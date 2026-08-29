# @portfolio/ask-corpus

The closed, bilingual corpus Ask Diego answers from, plus deterministic,
network-free retrieval. See `content/corpus/README.md` for the content
layout and citation-id convention, and `.cursor/rules/ai-guide.mdc` for the
binding product rules this package exists to satisfy.

## What's here

- `src/types.ts` / `src/schema.ts` — the versioned, closed (`additionalProperties:
false`) JSON Schema for one corpus entry and for the built registry
  manifest, mirroring `@portfolio/decisions`'s house style.
- `src/loader.ts` — `loadCorpusEntries()`, a filesystem-backed loader that
  reads and validates every `content/corpus/**/<id>.json`. Used only by
  `tools/build-corpus` and prerendered (build-time) Astro pages — never by
  the deployed `/api/ask` function.
- `src/bundle.ts` — `CORPUS_ENTRIES`, a statically-imported snapshot of the
  same data (`generated/corpus-bundle.json`, committed and drift-checked).
  This is what `/api/ask` actually imports: a plain JSON import that
  Vite/Rollup inlines into the function bundle at build time, so the
  deployed function needs zero filesystem access at request time.
- `src/search.ts` — `searchCorpus()`: a deterministic, ML-free
  keyword/token-overlap scorer (no embeddings, no external service). Given
  the same corpus and query, it always returns the same ranking.

## Regenerating the bundle

`pnpm corpus:build` (see `tools/build-corpus`) reads every source entry,
validates it, canonicalizes field order, and writes:

- `apps/site/public/corpus/v1/<id>.json` + `manifest.json` — the versioned,
  SHA-256-locked public artifact (mirrors `apps/site/public/decisions/v1/`).
- `packages/ask-corpus/generated/corpus-bundle.json` — the single-file
  snapshot `src/bundle.ts` imports.

`pnpm generated:check` rebuilds both in memory and fails if either has
drifted from what's committed.

## Why two copies of the same data?

`packages/decisions`'s manifests are only ever read by prerendered
(build-time) Astro pages, so a plain filesystem read is enough. Ask Diego is
different: `/api/ask.ts` is the one route that runs at **request** time, as
a deployed serverless function, and a dynamically-computed `readFile()` call
inside a bundled function is not reliably included in a Vercel deployment
without extra bundler configuration this session doesn't attempt (see
`docs/architecture.md` §7 and the root `HANDOFF.md`/final report for this
workstream). A statically-imported JSON module sidesteps that risk entirely
— it is guaranteed to be inlined at build time by the same bundler that
already produces the `/api/ask` function — at the cost of one extra
generated, committed, drift-checked file.
