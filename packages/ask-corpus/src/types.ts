export type CorpusLocale = "en" | "es";

export type CorpusCategory =
  "identity" | "decision" | "credential" | "education" | "availability" | "faq";

/**
 * One language's rendering of a corpus entry. `label` is a short citation
 * display string (e.g. "Prism — Five Decisions"); `question` is the
 * canonical phrasing this entry answers, used both for display and as
 * matching text; `answer` is the guideline-280-character response text;
 * `keywords` are curated matching hints weighted higher than incidental
 * words in `question`/`answer` by the deterministic search
 * (`./search.ts`). Every string must trace to `content/source/cv.yaml`,
 * `content/site/**`, or `content/decisions/**` (AGENTS.md, content.mdc) —
 * this package never invents a fact.
 */
export interface CorpusLocaleEntry {
  readonly label: string;
  readonly question: string;
  readonly answer: string;
  readonly keywords: readonly string[];
}

/**
 * The source-of-truth shape for one `content/corpus/**\/<id>.json` entry.
 * `citationId` is a stable identifier into the site's route space (e.g.
 * `"work/prism"`, `"resume#education-heading"`) — documented in
 * `content/corpus/README.md` — that the eventual page resolves to; it is
 * never a full URL, so it survives a route/slug rename without touching
 * every corpus entry.
 */
export interface CorpusEntry {
  readonly schemaVersion: "1.0.0";
  readonly collection: "ask-corpus";
  readonly id: string;
  readonly category: CorpusCategory;
  readonly citationId: string;
  readonly en: CorpusLocaleEntry;
  readonly es: CorpusLocaleEntry;
}

/** One entry in the built, versioned registry lock file. */
export interface CorpusRegistryEntry {
  readonly id: string;
  readonly path: string;
  readonly schemaVersion: "1.0.0";
  readonly byteLength: number;
  readonly sha256: string;
}

/** The `apps/site/public/corpus/v1/manifest.json` lock file shape. */
export interface CorpusRegistryManifest {
  readonly schemaVersion: "1.0.0";
  readonly collection: "ask-corpus";
  readonly entries: readonly CorpusRegistryEntry[];
}
