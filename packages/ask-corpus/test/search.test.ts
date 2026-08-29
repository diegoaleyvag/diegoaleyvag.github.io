import { describe, expect, it } from "vitest";

import { loadCorpusEntries } from "../src/loader.ts";
import {
  CONFIDENT_MATCH_THRESHOLD,
  WEAK_MATCH_THRESHOLD,
  searchCorpus,
  tokenize,
} from "../src/search.ts";
import type { CorpusEntry } from "../src/types.ts";

async function realEntries(): Promise<readonly CorpusEntry[]> {
  const loaded = await loadCorpusEntries();
  return loaded.map(({ entry }) => entry);
}

describe("tokenize", () => {
  it("lowercases, strips punctuation, and drops English stopwords", () => {
    expect(tokenize("What is Prism?", "en")).toEqual(["prism"]);
  });

  it("strips Spanish diacritics so accented and plain queries match", () => {
    expect(tokenize("¿Qué es Prism?", "es")).toEqual(
      tokenize("Que es Prism", "es"),
    );
  });

  it("drops single-character tokens and locale stopwords", () => {
    expect(tokenize("a b is the of it", "en")).toEqual([]);
  });
});

describe("searchCorpus against the real corpus", () => {
  it("confidently matches a direct 'what is <decision>' question", async () => {
    const entries = await realEntries();
    const [top] = searchCorpus(entries, "en", "What is Prism?");

    expect(top?.entry.id).toBe("decision-prism");
    expect(top?.score).toBeGreaterThanOrEqual(CONFIDENT_MATCH_THRESHOLD);
  });

  it("confidently matches the same question in Spanish, in Spanish", async () => {
    const entries = await realEntries();
    const [top] = searchCorpus(entries, "es", "¿Qué es Prism?");

    expect(top?.entry.id).toBe("decision-prism");
    expect(top?.score).toBeGreaterThanOrEqual(CONFIDENT_MATCH_THRESHOLD);
  });

  it("confidently matches an availability question", async () => {
    const entries = await realEntries();
    const [top] = searchCorpus(
      entries,
      "en",
      "Is Diego available for a remote junior AI role?",
    );

    expect(top?.entry.id).toBe("availability-status");
    expect(top?.score).toBeGreaterThanOrEqual(CONFIDENT_MATCH_THRESHOLD);
  });

  it("confidently matches a technologies question", async () => {
    const entries = await realEntries();
    const [top] = searchCorpus(
      entries,
      "en",
      "What technologies and programming languages does Diego use?",
    );

    expect(top?.entry.id).toBe("faq-technologies");
    expect(top?.score).toBeGreaterThanOrEqual(CONFIDENT_MATCH_THRESHOLD);
  });

  it("routes an opinion question to the scope disclaimer, never a guess", async () => {
    const entries = await realEntries();
    const [top] = searchCorpus(
      entries,
      "en",
      "What is Diego's favorite programming language?",
    );

    expect(top?.entry.id).toBe("faq-scope-disclaimer");
  });

  it("finds no meaningful match for a fully unrelated question", async () => {
    const entries = await realEntries();
    const [top] = searchCorpus(
      entries,
      "en",
      "What's the weather like in Paris tomorrow?",
    );

    expect(top?.score ?? 0).toBeLessThan(WEAK_MATCH_THRESHOLD);
  });

  it("returns every entry, ranked, never throwing on an empty query", async () => {
    const entries = await realEntries();
    const matches = searchCorpus(entries, "en", "");

    expect(matches).toHaveLength(entries.length);
    for (const match of matches) {
      expect(match.score).toBe(0);
    }
  });

  it("breaks score ties deterministically by id", () => {
    const synthetic: CorpusEntry[] = [
      {
        schemaVersion: "1.0.0",
        collection: "ask-corpus",
        id: "zzz-tie",
        category: "faq",
        citationId: "home",
        en: {
          label: "Tie",
          question: "tie example",
          answer: "tie example answer",
          keywords: ["tie"],
        },
        es: {
          label: "Empate",
          question: "ejemplo de empate",
          answer: "respuesta de ejemplo de empate",
          keywords: ["empate"],
        },
      },
      {
        schemaVersion: "1.0.0",
        collection: "ask-corpus",
        id: "aaa-tie",
        category: "faq",
        citationId: "home",
        en: {
          label: "Tie",
          question: "tie example",
          answer: "tie example answer",
          keywords: ["tie"],
        },
        es: {
          label: "Empate",
          question: "ejemplo de empate",
          answer: "respuesta de ejemplo de empate",
          keywords: ["empate"],
        },
      },
    ];

    const [first, second] = searchCorpus(synthetic, "en", "tie");
    expect(first?.score).toBe(second?.score);
    expect(first?.entry.id).toBe("aaa-tie");
    expect(second?.entry.id).toBe("zzz-tie");
  });
});
