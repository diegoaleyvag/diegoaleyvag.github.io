import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { loadDecisionManifests } from "@portfolio/decisions";
import {
  mapCopyFor,
  statusLabel,
} from "../../apps/site/src/features/capability-map/copy.ts";

const expected = {
  prism: { status: "released", hasDemo: true, hasMethodology: false },
  relay: { status: "released", hasDemo: true, hasMethodology: true },
  limen: { status: "released", hasDemo: true, hasMethodology: false },
  vector: { status: "released", hasDemo: true, hasMethodology: false },
  axiom: { status: "verified", hasDemo: false, hasMethodology: true },
} as const;

describe("Five Decisions federation", () => {
  it("keeps the C8 public repositories, statuses, and links", async () => {
    const manifests = await loadDecisionManifests();

    expect(manifests.map(({ id }) => id)).toEqual(Object.keys(expected).sort());
    for (const { id, manifest } of manifests) {
      const expectation = expected[id as keyof typeof expected];
      expect(manifest.status).toBe(expectation.status);
      const repository = new URL(manifest.links.repository ?? "");
      expect(repository.protocol).toBe("https:");
      expect(repository.pathname).toMatch(new RegExp(`/${id}$`));
      expect(manifest.links.demo !== null).toBe(expectation.hasDemo);
      if (manifest.links.demo) {
        expect(new URL(manifest.links.demo).protocol).toBe("https:");
      }
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
      expect(entry.es.answer).toContain(
        `Estado: ${expectation.status === "released" ? "publicado" : "verificado"}.`,
      );
    }
  });

  it("localizes released and verified statuses for the capability map", () => {
    expect(statusLabel(mapCopyFor("en"), "released")).toBe("Released");
    expect(statusLabel(mapCopyFor("es"), "released")).toBe("Publicado");
    expect(statusLabel(mapCopyFor("en"), "verified")).toBe("Verified");
    expect(statusLabel(mapCopyFor("es"), "verified")).toBe("Verificado");
  });
});
