import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const workspaceUrl = new URL("../../", import.meta.url);

const expectedSources = {
  prism: "9d1efc794c1fe5f0ae481ad4bc12711012872810",
  relay: "651a153169d6459c5b0d30869f30ac2cabfc7779",
  limen: "e695b7886274199aedd6b7dc3c0f22a97816e7f3",
  vector: "eee18d9fc9ea828924a3d81e2c0ea79a6e91ffb5",
  axiom: "e333f8ca80212bd5805e14eaf92f226673dad41b",
} as const;

async function readWorkspaceFile(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, workspaceUrl), "utf8");
}

describe("Five Decisions final federation", () => {
  it("pins every source to its final verified commit", async () => {
    const syncTool = await readWorkspaceFile("tools/sync-decisions/src/cli.ts");

    for (const commit of Object.values(expectedSources)) {
      expect(syncTool).toContain(`commit: "${commit}"`);
    }
    expect(syncTool).not.toContain("commitPrefix");
  });

  it("ships five bilingual, verified manifests with public links and no demos", async () => {
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
        evidence: unknown[];
        links: { repository: string; demo: null };
      };
      const corpus = JSON.parse(
        await readWorkspaceFile(`content/corpus/decisions/decision-${id}.json`),
      ) as { en: { answer: string }; es: { answer: string } };

      expect(manifest.status).toBe("verified");
      expect(manifest.title).toBeTruthy();
      expect(manifest.summary).toBeTruthy();
      expect(manifest.capabilities.length).toBeGreaterThan(0);
      expect(manifest.evidence.length).toBeGreaterThan(0);
      const repository = new URL(manifest.links.repository);
      expect(repository.protocol).toBe("https:");
      expect(repository.hostname).toBe("github.com");
      expect(repository.pathname).toBe(`/${"diegoaleyvag"}/${id}`);
      expect(manifest.links.demo).toBeNull();
      expect(corpus.en.answer).toContain("Status: verified.");
      expect(corpus.es.answer).toContain("Estado: verificado.");
    }
  });
});
