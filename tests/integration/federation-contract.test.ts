import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const workspaceUrl = new URL("../../", import.meta.url);

const expectedSources = {
  prism: "faac6b68bc2305ba8849b4cf15dc1a0dab423fce",
  relay: "40d3063824a00f5d29b740c78de981b210871fe6",
  limen: "5dc60e4b5a95b3f51fa1d08529d403b0a31da5c1",
  vector: "384dd00294ffec38f215b989bb9335404793a0d8",
  axiom: "adcfd97de3d233faefec8336273d548948ef18b4",
} as const;

const releasedIds = ["prism", "relay", "limen", "vector"] as const;

async function readWorkspaceFile(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, workspaceUrl), "utf8");
}

describe("Five Decisions final federation", () => {
  it("pins every source to its final C8 commit", async () => {
    const syncTool = await readWorkspaceFile("tools/sync-decisions/src/cli.ts");

    for (const commit of Object.values(expectedSources)) {
      expect(syncTool).toContain(`commit: "${commit}"`);
    }
    expect(syncTool).not.toContain("commitPrefix");
  });

  it("ships released demos, verified Axiom, and immutable deployment evidence", async () => {
    for (const id of Object.keys(expectedSources)) {
      const manifest = JSON.parse(
        await readWorkspaceFile(
          `content/decisions/${id}/portfolio.project.json`,
        ),
      ) as {
        status: string;
        title: string;
        summary: string;
        capabilities: unknown[];
        evidence: { type: string; description: string; reference: string }[];
        links: {
          repository: string;
          demo: string | null;
          methodology: string | null;
        };
      };
      const corpus = JSON.parse(
        await readWorkspaceFile(`content/corpus/decisions/decision-${id}.json`),
      ) as { en: { answer: string }; es: { answer: string } };

      const isReleased = releasedIds.includes(
        id as (typeof releasedIds)[number],
      );
      expect(manifest.status).toBe(isReleased ? "released" : "verified");
      expect(manifest.title).toBeTruthy();
      expect(manifest.summary).toBeTruthy();
      expect(manifest.capabilities.length).toBeGreaterThan(0);
      expect(manifest.evidence.length).toBeGreaterThan(0);
      const repository = new URL(manifest.links.repository);
      expect(repository.protocol).toBe("https:");
      expect(repository.hostname).toBe("github.com");
      expect(repository.pathname).toBe(`/${"diegoaleyvag"}/${id}`);
      expect(manifest.links.demo === null).toBe(!isReleased);
      expect(manifest.links.methodology).toEqual(
        id === "relay" || id === "axiom"
          ? expect.stringMatching(/^https:\/\/github\.com\//)
          : null,
      );
      const productionEvidence = manifest.evidence.filter(
        (entry) => entry.type === "production deployment",
      );
      expect(productionEvidence).toHaveLength(isReleased ? 1 : 0);
      for (const entry of productionEvidence) {
        expect(entry.reference).toMatch(/^https:\/\/.+\.vercel\.app(?:\/|$)/);
        expect(entry.reference).not.toMatch(
          /^https:\/\/five-decisions-(prism|relay|limen|vector)\.vercel\.app/,
        );
        expect(entry.description).not.toMatch(/dpl_|[0-9a-f]{7,}/i);
      }
      expect(corpus.en.answer).toContain(
        `Status: ${isReleased ? "released" : "verified"}.`,
      );
      expect(corpus.es.answer).toContain(
        `Estado: ${isReleased ? "publicado" : "verificado"}.`,
      );
    }
  });
});
