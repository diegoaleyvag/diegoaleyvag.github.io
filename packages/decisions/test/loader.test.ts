import { describe, expect, it } from "vitest";

import {
  loadDecisionManifests,
  parseDecisionManifestJson,
  parseDecisionRegistryManifestJson,
} from "../src/loader.ts";

const FIVE_DECISION_IDS = ["axiom", "limen", "prism", "relay", "vector"];

function validManifestObject(): Record<string, unknown> {
  return {
    schemaVersion: "1.0.0",
    collection: "five-decisions",
    id: "prism",
    title: "Prism",
    decision: "When is a model good enough?",
    learningOrigin: "2026-05",
    buildStarted: "2026-08-13",
    status: "building",
    summary: "One factual sentence.",
    capabilities: [],
    evidence: [],
    links: { repository: null, demo: null, methodology: null },
  };
}

describe("Five Decisions manifest loader", () => {
  it("loads exactly the five published decisions, sorted by id", async () => {
    const loaded = await loadDecisionManifests();

    expect(loaded.map((entry) => entry.id)).toEqual(FIVE_DECISION_IDS);
    for (const entry of loaded) {
      expect(entry.manifest.id).toBe(entry.id);
      expect(entry.manifest.collection).toBe("five-decisions");
      expect(entry.manifest.schemaVersion).toBe("1.0.0");
    }
  });

  it("keeps the synchronized build dates and verified status truthful", async () => {
    const loaded = await loadDecisionManifests();
    const byId = new Map(loaded.map((entry) => [entry.id, entry.manifest]));

    for (const id of ["prism", "limen", "axiom", "vector"]) {
      const manifest = byId.get(id);
      expect(manifest?.status).toBe("building");
      expect(manifest?.buildStarted).toBe("2026-08-13");
    }
    expect(byId.get("relay")?.status).toBe("verified");
    expect(byId.get("relay")?.buildStarted).toBe("2026-08-13");
  });

  it("retains validated evidence and no hosted demo URLs", async () => {
    const loaded = await loadDecisionManifests();

    for (const { manifest } of loaded) {
      expect(manifest.capabilities.length).toBeGreaterThan(0);
      expect(manifest.evidence.length).toBeGreaterThan(0);
      expect(manifest.links.repository).not.toBeNull();
      expect(manifest.links.demo).toBeNull();
    }
  });

  it("gives every decision a distinct, non-templated summary", async () => {
    const loaded = await loadDecisionManifests();
    const summaries = loaded.map((entry) => entry.manifest.summary);

    expect(new Set(summaries).size).toBe(summaries.length);
    for (const summary of summaries) {
      expect(summary.length).toBeGreaterThan(0);
    }
  });

  it("accepts a well-formed manifest", () => {
    expect(() =>
      parseDecisionManifestJson(JSON.stringify(validManifestObject())),
    ).not.toThrow();
  });

  it("rejects a manifest missing a required field", () => {
    const value = validManifestObject();
    delete value["summary"];

    expect(() => parseDecisionManifestJson(JSON.stringify(value))).toThrow(
      /must have required property 'summary'/,
    );
  });

  it("rejects a manifest with an unknown field", () => {
    const value = validManifestObject();
    value["unreviewed_field"] = "not accepted";

    expect(() => parseDecisionManifestJson(JSON.stringify(value))).toThrow(
      /must NOT have additional properties/,
    );
  });

  it("rejects a status outside the closed enum", () => {
    const value = validManifestObject();
    value["status"] = "shipped";

    expect(() => parseDecisionManifestJson(JSON.stringify(value))).toThrow();
  });

  it("rejects a links object that omits a required key", () => {
    const value = validManifestObject();
    value["links"] = { repository: null, demo: null };

    expect(() => parseDecisionManifestJson(JSON.stringify(value))).toThrow(
      /must have required property 'methodology'/,
    );
  });

  it("rejects malformed JSON", () => {
    expect(() => parseDecisionManifestJson("{not json")).toThrow(
      /not valid JSON/,
    );
  });

  it("round-trips a valid registry manifest", () => {
    const registry = {
      schemaVersion: "1.0.0",
      collection: "five-decisions",
      entries: [
        {
          id: "prism",
          path: "/decisions/v1/prism.json",
          schemaVersion: "1.0.0",
          byteLength: 42,
          sha256: "a".repeat(64),
        },
      ],
    };

    expect(parseDecisionRegistryManifestJson(JSON.stringify(registry))).toEqual(
      registry,
    );
  });

  it("rejects a registry manifest with a malformed digest", () => {
    const registry = {
      schemaVersion: "1.0.0",
      collection: "five-decisions",
      entries: [
        {
          id: "prism",
          path: "/decisions/v1/prism.json",
          schemaVersion: "1.0.0",
          byteLength: 42,
          sha256: "not-a-digest",
        },
      ],
    };

    expect(() =>
      parseDecisionRegistryManifestJson(JSON.stringify(registry)),
    ).toThrow();
  });
});
