export { CORPUS_ENTRIES } from "./bundle.ts";
export {
  CONTENT_CORPUS_DIRECTORY,
  assertCorpusRegistryManifest,
  loadCorpusEntries,
  parseCorpusEntryJson,
  parseCorpusRegistryManifestJson,
} from "./loader.ts";
export type { LoadedCorpusEntry } from "./loader.ts";
export {
  CORPUS_COLLECTION,
  CORPUS_SCHEMA_VERSION,
  corpusEntrySchema,
  corpusRegistryManifestSchema,
} from "./schema.ts";
export {
  CONFIDENT_MATCH_THRESHOLD,
  WEAK_MATCH_THRESHOLD,
  searchCorpus,
  tokenize,
} from "./search.ts";
export type { CorpusMatch } from "./search.ts";
export type {
  CorpusCategory,
  CorpusEntry,
  CorpusLocale,
  CorpusLocaleEntry,
  CorpusRegistryEntry,
  CorpusRegistryManifest,
} from "./types.ts";
