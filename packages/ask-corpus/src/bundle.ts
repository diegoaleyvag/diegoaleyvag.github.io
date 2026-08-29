import corpusBundle from "../generated/corpus-bundle.json" with { type: "json" };

import type { CorpusEntry } from "./types.ts";

/**
 * A statically-imported, build-time-generated snapshot of every corpus
 * entry (`tools/build-corpus` writes `../generated/corpus-bundle.json`,
 * validated and drift-checked the same way
 * `packages/resume/generated/resume-provenance.json` is). Vite/Rollup
 * inlines this JSON directly into the `/api/ask` serverless function's
 * bundle at build time, so the deployed function never reads
 * `content/corpus/**` from disk at request time — only `tools/build-corpus`
 * and prerendered Astro pages use the filesystem-backed
 * `loadCorpusEntries()` in `./loader.ts`. This is the one export
 * `apps/site/src/lib/ask-diego` should use.
 */
export const CORPUS_ENTRIES: readonly CorpusEntry[] =
  corpusBundle as readonly CorpusEntry[];
