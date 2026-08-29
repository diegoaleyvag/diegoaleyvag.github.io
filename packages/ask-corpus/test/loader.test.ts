import { describe, expect, it } from "vitest";

import {
  loadCorpusEntries,
  parseCorpusEntryJson,
  parseCorpusRegistryManifestJson,
} from "../src/loader.ts";

const EXPECTED_CATEGORIES = [
  "availability",
  "credential",
  "decision",
  "education",
  "faq",
  "identity",
] as const;

function validEntryObject(): Record<string, unknown> {
  return {
    schemaVersion: "1.0.0",
    collection: "ask-corpus",
    id: "faq-example",
    category: "faq",
    citationId: "home",
    en: {
      label: "Example",
      question: "An example question?",
      answer: "An example answer under the guideline length.",
      keywords: ["example"],
    },
    es: {
      label: "Ejemplo",
      question: "¿Una pregunta de ejemplo?",
      answer: "Una respuesta de ejemplo bajo el límite recomendado.",
      keywords: ["ejemplo"],
    },
  };
}

describe("Ask Diego corpus loader", () => {
  it("loads every real corpus entry, validated, sorted by id", async () => {
    const loaded = await loadCorpusEntries();

    expect(loaded.length).toBeGreaterThanOrEqual(15);
    const ids = loaded.map((entry) => entry.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);

    for (const { entry, id } of loaded) {
      expect(entry.id).toBe(id);
      expect(entry.schemaVersion).toBe("1.0.0");
      expect(entry.collection).toBe("ask-corpus");
      expect(EXPECTED_CATEGORIES).toContain(entry.category);
    }
  });

  it("covers every required corpus area at least once", async () => {
    const loaded = await loadCorpusEntries();
    const categories = new Set(loaded.map(({ entry }) => entry.category));

    for (const category of EXPECTED_CATEGORIES) {
      expect(categories.has(category)).toBe(true);
    }
  });

  it("never exceeds the answer-length guideline in either language", async () => {
    const loaded = await loadCorpusEntries();

    for (const { entry } of loaded) {
      expect(entry.en.answer.length).toBeLessThanOrEqual(280);
      expect(entry.es.answer.length).toBeLessThanOrEqual(280);
    }
  });

  it("never mirrors the English answer word-for-word into Spanish", async () => {
    const loaded = await loadCorpusEntries();

    for (const { entry } of loaded) {
      expect(entry.es.answer).not.toBe(entry.en.answer);
    }
  });

  it("gives every entry a citation id that traces to a documented route", async () => {
    const loaded = await loadCorpusEntries();
    const documented =
      /^(home|resume|resume#[a-z0-9-]+|ask|work|work\/(prism|relay|limen|axiom|vector))$/;

    for (const { entry } of loaded) {
      expect(entry.citationId).toMatch(documented);
    }
  });

  it("accepts a well-formed entry", () => {
    expect(() =>
      parseCorpusEntryJson(JSON.stringify(validEntryObject())),
    ).not.toThrow();
  });

  it("rejects an entry missing a required field", () => {
    const value = validEntryObject();
    delete value["citationId"];

    expect(() => parseCorpusEntryJson(JSON.stringify(value))).toThrow(
      /must have required property 'citationId'/,
    );
  });

  it("rejects an entry with an unknown field", () => {
    const value = validEntryObject();
    value["unreviewed_field"] = "not accepted";

    expect(() => parseCorpusEntryJson(JSON.stringify(value))).toThrow(
      /must NOT have additional properties/,
    );
  });

  it("rejects an answer over the 280-character guideline", () => {
    const value = validEntryObject();
    (value["en"] as Record<string, unknown>)["answer"] = "x".repeat(281);

    expect(() => parseCorpusEntryJson(JSON.stringify(value))).toThrow();
  });

  it("rejects a category outside the closed enum", () => {
    const value = validEntryObject();
    value["category"] = "opinion";

    expect(() => parseCorpusEntryJson(JSON.stringify(value))).toThrow();
  });

  it("rejects malformed JSON", () => {
    expect(() => parseCorpusEntryJson("{not json")).toThrow(/not valid JSON/);
  });

  it("round-trips a valid registry manifest", () => {
    const registry = {
      schemaVersion: "1.0.0",
      collection: "ask-corpus",
      entries: [
        {
          id: "faq-example",
          path: "/corpus/v1/faq-example.json",
          schemaVersion: "1.0.0",
          byteLength: 42,
          sha256: "a".repeat(64),
        },
      ],
    };

    expect(parseCorpusRegistryManifestJson(JSON.stringify(registry))).toEqual(
      registry,
    );
  });

  it("rejects a registry manifest with a malformed digest", () => {
    const registry = {
      schemaVersion: "1.0.0",
      collection: "ask-corpus",
      entries: [
        {
          id: "faq-example",
          path: "/corpus/v1/faq-example.json",
          schemaVersion: "1.0.0",
          byteLength: 42,
          sha256: "not-a-digest",
        },
      ],
    };

    expect(() =>
      parseCorpusRegistryManifestJson(JSON.stringify(registry)),
    ).toThrow();
  });
});
