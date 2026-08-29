import { createHash } from "node:crypto";

import {
  CORPUS_COLLECTION,
  CORPUS_SCHEMA_VERSION,
  assertCorpusRegistryManifest,
  loadCorpusEntries,
  type CorpusEntry,
  type CorpusRegistryEntry,
  type CorpusRegistryManifest,
  type LoadedCorpusEntry,
} from "@portfolio/ask-corpus";

export const CORPUS_OUTPUT_PATH_PREFIX = "/corpus/v1/" as const;
export const CORPUS_BUNDLE_FILE_NAME = "corpus-bundle.json" as const;

export interface GeneratedCorpusArtifacts {
  readonly publicFiles: ReadonlyMap<string, Uint8Array>;
  readonly bundleBytes: Uint8Array;
  readonly manifest: CorpusRegistryManifest;
  readonly loaded: readonly LoadedCorpusEntry[];
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function encodeArtifact(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Rebuilds every field in a fixed order so the output is byte-identical
 * regardless of how a source entry happened to order its own keys. Mirrors
 * `tools/build-decisions/src/builder.ts`'s `canonicalizeManifest`.
 */
function canonicalizeEntry(entry: CorpusEntry): CorpusEntry {
  const canonicalizeLocale = (
    locale: CorpusEntry["en"],
  ): CorpusEntry["en"] => ({
    label: locale.label,
    question: locale.question,
    answer: locale.answer,
    keywords: [...locale.keywords],
  });

  return {
    schemaVersion: entry.schemaVersion,
    collection: entry.collection,
    id: entry.id,
    category: entry.category,
    citationId: entry.citationId,
    en: canonicalizeLocale(entry.en),
    es: canonicalizeLocale(entry.es),
  };
}

/**
 * Reads every source entry, validates it, canonicalizes field order, and
 * builds both the versioned public artifact set and the single-file
 * generated bundle in memory. Pure and network-free: the same source
 * entries always produce byte-identical output, which `check-generated.ts`
 * relies on for its drift check.
 */
export async function buildCorpusArtifacts(): Promise<GeneratedCorpusArtifacts> {
  const loaded = await loadCorpusEntries();

  const publicFiles = new Map<string, Uint8Array>();
  const entries: CorpusRegistryEntry[] = [];
  const canonicalEntries: CorpusEntry[] = [];

  for (const { id, entry } of loaded) {
    const canonical = canonicalizeEntry(entry);
    canonicalEntries.push(canonical);

    const bytes = encodeArtifact(canonical);
    publicFiles.set(`${id}.json`, bytes);
    entries.push({
      id,
      path: `${CORPUS_OUTPUT_PATH_PREFIX}${id}.json`,
      schemaVersion: CORPUS_SCHEMA_VERSION,
      byteLength: bytes.byteLength,
      sha256: sha256Hex(bytes),
    });
  }

  const manifestCandidate: CorpusRegistryManifest = {
    schemaVersion: CORPUS_SCHEMA_VERSION,
    collection: CORPUS_COLLECTION,
    entries,
  };
  assertCorpusRegistryManifest(manifestCandidate);
  publicFiles.set("manifest.json", encodeArtifact(manifestCandidate));

  const bundleBytes = encodeArtifact(canonicalEntries);

  return { publicFiles, bundleBytes, manifest: manifestCandidate, loaded };
}
