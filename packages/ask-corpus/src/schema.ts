import type { JSONSchemaType } from "ajv";

import type {
  CorpusEntry,
  CorpusLocaleEntry,
  CorpusRegistryEntry,
  CorpusRegistryManifest,
} from "./types.ts";

export const CORPUS_SCHEMA_VERSION = "1.0.0" as const;
export const CORPUS_COLLECTION = "ask-corpus" as const;

const slugPattern = "^[a-z][a-z0-9-]*$";
const citationIdPattern = "^[a-z][a-z0-9/#-]*$";
const digestPattern = "^[a-f0-9]{64}$";
const categoryEnum = [
  "identity",
  "decision",
  "credential",
  "education",
  "availability",
  "faq",
] as const;

// Mirrors the ~280-character answer guideline in `.cursor/rules/ai-guide.mdc`
// as a hard schema ceiling: unlike a model-generated answer (enforced at
// request time in apps/site/src/lib/ask-diego/response.ts, with graceful
// truncation), curated corpus content has no excuse to exceed it — the
// author controls every character.
const localeEntrySchema: JSONSchemaType<CorpusLocaleEntry> = {
  type: "object",
  additionalProperties: false,
  required: ["label", "question", "answer", "keywords"],
  properties: {
    label: { type: "string", minLength: 1, maxLength: 80 },
    question: { type: "string", minLength: 1, maxLength: 200 },
    answer: { type: "string", minLength: 1, maxLength: 280 },
    keywords: {
      type: "array",
      minItems: 1,
      maxItems: 24,
      items: { type: "string", minLength: 2, maxLength: 40 },
    },
  },
};

/**
 * Versioned, closed schema for one `content/corpus/**\/<id>.json` source
 * entry. Mirrors the strict-AJV, `additionalProperties: false` discipline in
 * `@portfolio/decisions`'s `portfolioProjectSchema`: unknown or missing
 * fields fail validation, never a silent pass.
 */
export const corpusEntrySchema: JSONSchemaType<CorpusEntry> = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/portfolio/ask-corpus-entry/v1",
  title: "Ask Diego corpus entry v1",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "collection",
    "id",
    "category",
    "citationId",
    "en",
    "es",
  ],
  properties: {
    schemaVersion: { type: "string", const: CORPUS_SCHEMA_VERSION },
    collection: { type: "string", const: CORPUS_COLLECTION },
    id: { type: "string", pattern: slugPattern, maxLength: 60 },
    category: { type: "string", enum: categoryEnum },
    citationId: { type: "string", pattern: citationIdPattern, maxLength: 80 },
    en: localeEntrySchema,
    es: localeEntrySchema,
  },
};

const registryEntrySchema: JSONSchemaType<CorpusRegistryEntry> = {
  type: "object",
  additionalProperties: false,
  required: ["id", "path", "schemaVersion", "byteLength", "sha256"],
  properties: {
    id: { type: "string", pattern: slugPattern, maxLength: 60 },
    path: { type: "string", pattern: "^/corpus/v1/[a-z0-9-]+\\.json$" },
    schemaVersion: { type: "string", const: CORPUS_SCHEMA_VERSION },
    byteLength: { type: "integer", minimum: 1 },
    sha256: { type: "string", pattern: digestPattern },
  },
};

/**
 * Versioned, closed schema for the built `apps/site/public/corpus/v1/manifest.json`
 * lock file `tools/build-corpus` writes. Byte-identical on every rebuild
 * from the same source entries (no wall clock, no non-deterministic order).
 */
export const corpusRegistryManifestSchema: JSONSchemaType<CorpusRegistryManifest> =
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://schemas.example.invalid/portfolio/ask-corpus-registry-manifest/v1",
    title: "Ask Diego corpus registry manifest v1",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "collection", "entries"],
    properties: {
      schemaVersion: { type: "string", const: CORPUS_SCHEMA_VERSION },
      collection: { type: "string", const: CORPUS_COLLECTION },
      entries: {
        type: "array",
        minItems: 1,
        items: registryEntrySchema,
      },
    },
  };
