import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { loadDecisionManifests } from "@portfolio/decisions";

const expected = {
  prism: { status: "verified", hasMethodology: false },
  relay: { status: "verified", hasMethodology: true },
  limen: { status: "verified", hasMethodology: false },
  vector: { status: "verified", hasMethodology: false },
  axiom: { status: "verified", hasMethodology: true },
} as const;

describe("Five Decisions federation", () => {
  it("keeps the C3 public repositories and validated statuses", async () => {
    const manifests = await loadDecisionManifests();

    expect(manifests.map(({ id }) => id)).toEqual(Object.keys(expected).sort());
    for (const { id, manifest } of manifests) {
      const expectation = expected[id as keyof typeof expected];
      expect(manifest.status).toBe(expectation.status);
      const repository = new URL(manifest.links.repository ?? "");
      expect(repository.protocol).toBe("https:");
      expect(repository.pathname).toMatch(new RegExp(`/${id}$`));
      expect(manifest.links.demo).toBeNull();
      expect(manifest.links.methodology !== null).toBe(
        expectation.hasMethodology,
      );
      expect(manifest.evidence.length).toBeGreaterThan(0);
    }
  });

  it("keeps the decision corpus aligned to synchronized statuses", async () => {
    for (const [id, expectation] of Object.entries(expected)) {
      const source = await readFile(
        new URL(
          `../../content/corpus/decisions/decision-${id}.json`,
          import.meta.url,
        ),
        "utf8",
      );
      const entry = JSON.parse(source) as {
        en: { answer: string };
        es: { answer: string };
      };

      expect(entry.en.answer).toContain(`Status: ${expectation.status}.`);
      expect(entry.es.answer).toMatch(/Estado: (en construcción|verificado)\./);
    }
  });
});
