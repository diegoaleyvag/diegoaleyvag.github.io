import type { CorpusEntry, CorpusLocale } from "./types.ts";

/**
 * Deterministic, network-free, ML-free matching: classic TF-IDF cosine
 * similarity over token sets built from each entry's question, curated
 * keywords, and answer text. No embeddings, no external service, no
 * randomness, no corpus-wide state cached across calls — the same corpus
 * and query always produce the same ranking, which is what makes the
 * "confident enough to answer without a provider" boundary in
 * `apps/site/src/lib/ask-diego/respond.ts` testable and honest.
 *
 * Plain token overlap (unweighted Jaccard/F1) was tried first and rejected:
 * a one-word query like "Prism?" only ever contributes one token, so its
 * overlap with a ~30-token entry vocabulary (question + keywords + answer)
 * stayed low no matter how distinctive that one token was. TF-IDF fixes
 * this the standard information-retrieval way — a rare, corpus-specific
 * token like "prism" or "escom" carries far more weight than a common one
 * like "diego" or "system" that appears in most entries.
 */

const enStopwords = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "by",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "has",
  "have",
  "he",
  "his",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "there",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "you",
  "your",
]);

const esStopwords = new Set([
  "a",
  "al",
  "algo",
  "como",
  "con",
  "cual",
  "cuales",
  "cuando",
  "de",
  "del",
  "donde",
  "el",
  "ella",
  "en",
  "es",
  "esta",
  "este",
  "hace",
  "hay",
  "la",
  "las",
  "lo",
  "los",
  "para",
  "por",
  "que",
  "quien",
  "se",
  "ser",
  "su",
  "sus",
  "tiene",
  "tu",
  "un",
  "una",
  "y",
]);

function stopwordsFor(locale: CorpusLocale): ReadonlySet<string> {
  return locale === "es" ? esStopwords : enStopwords;
}

/**
 * Lowercases, strips diacritics (so "que es prism" and "qué es Prism?"
 * tokenize identically), splits on non-word boundaries, and drops stopwords
 * and single-character tokens. Exported so the composition root and tests
 * can reason about tokens directly.
 */
export function tokenize(text: string, locale: CorpusLocale): string[] {
  const stopwords = stopwordsFor(locale);
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const rawTokens = normalized.match(/[a-z0-9]+/g) ?? [];
  return rawTokens.filter(
    (token) => token.length >= 2 && !stopwords.has(token),
  );
}

function termFrequencies(tokens: readonly string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

/**
 * The entry's matchable vocabulary, repeated per field to weight curated
 * keywords highest, the canonical question next, and incidental answer
 * wording least — without needing a separate per-field score to combine.
 */
const QUESTION_REPEATS = 2;
const KEYWORD_REPEATS = 3;
const ANSWER_REPEATS = 1;

function entryDocumentTokens(
  entry: CorpusEntry,
  locale: CorpusLocale,
): string[] {
  const localeEntry = entry[locale];
  return [
    ...Array<string>(QUESTION_REPEATS)
      .fill("")
      .flatMap(() => tokenize(localeEntry.question, locale)),
    ...Array<string>(KEYWORD_REPEATS)
      .fill("")
      .flatMap(() => tokenize(localeEntry.keywords.join(" "), locale)),
    ...Array<string>(ANSWER_REPEATS)
      .fill("")
      .flatMap(() => tokenize(localeEntry.answer, locale)),
  ];
}

/**
 * Document frequency (how many entries mention each token at all, counted
 * once per entry regardless of repeats) drives the IDF weight below. Built
 * fresh per call from the entries actually passed in — the corpus is small
 * enough (tens of entries) that this costs microseconds, and it keeps
 * `searchCorpus` a pure function with no hidden cross-request cache.
 */
function buildDocumentFrequencies(
  entries: readonly CorpusEntry[],
  locale: CorpusLocale,
): Map<string, number> {
  const documentFrequency = new Map<string, number>();
  for (const entry of entries) {
    const localeEntry = entry[locale];
    const uniqueTokens = new Set(
      tokenize(
        `${localeEntry.question} ${localeEntry.keywords.join(" ")} ${localeEntry.answer}`,
        locale,
      ),
    );
    for (const token of uniqueTokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  return documentFrequency;
}

function idfWeight(
  documentFrequency: ReadonlyMap<string, number>,
  totalDocuments: number,
  token: string,
): number {
  const df = documentFrequency.get(token) ?? 1;
  return Math.log(1 + totalDocuments / df);
}

function tfIdfVector(
  tokens: readonly string[],
  documentFrequency: ReadonlyMap<string, number>,
  totalDocuments: number,
): Map<string, number> {
  const vector = new Map<string, number>();
  for (const [token, frequency] of termFrequencies(tokens)) {
    vector.set(
      token,
      frequency * idfWeight(documentFrequency, totalDocuments, token),
    );
  }
  return vector;
}

function cosineSimilarity(
  left: ReadonlyMap<string, number>,
  right: ReadonlyMap<string, number>,
): number {
  let dotProduct = 0;
  for (const [token, leftWeight] of left) {
    const rightWeight = right.get(token);
    if (rightWeight !== undefined) {
      dotProduct += leftWeight * rightWeight;
    }
  }
  if (dotProduct === 0) {
    return 0;
  }

  const norm = (vector: ReadonlyMap<string, number>): number =>
    Math.sqrt(
      [...vector.values()].reduce((sum, weight) => sum + weight * weight, 0),
    );

  const denominator = norm(left) * norm(right);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export interface CorpusMatch {
  readonly entry: CorpusEntry;
  readonly locale: CorpusLocale;
  readonly score: number;
}

/**
 * Ranks every corpus entry against `query` for `locale`, using only the
 * current question (never conversation history — determinism and
 * simplicity over cross-turn sophistication, see `respond.ts`). Ties break
 * on `id` ascending so results are stable across runs and machines.
 */
export function searchCorpus(
  entries: readonly CorpusEntry[],
  locale: CorpusLocale,
  query: string,
): readonly CorpusMatch[] {
  const totalDocuments = entries.length;
  const documentFrequency = buildDocumentFrequencies(entries, locale);
  const queryVector = tfIdfVector(
    tokenize(query, locale),
    documentFrequency,
    totalDocuments,
  );

  const matches = entries.map((entry) => {
    const entryVector = tfIdfVector(
      entryDocumentTokens(entry, locale),
      documentFrequency,
      totalDocuments,
    );
    const score = cosineSimilarity(queryVector, entryVector);
    return { entry, locale, score };
  });

  return matches.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.entry.id.localeCompare(right.entry.id);
  });
}

/** A match confident enough to answer directly, without a provider call. */
export const CONFIDENT_MATCH_THRESHOLD = 0.4;

/**
 * Below this, there is no meaningful signal at all: `respond.ts` never
 * calls a provider and always returns the honest "don't know" fallback
 * (ai-guide.mdc: "never call a model provider to guess one").
 */
export const WEAK_MATCH_THRESHOLD = 0.12;
