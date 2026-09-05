import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const workspaceUrl = new URL("../../", import.meta.url);

async function readWorkspaceFile(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, workspaceUrl), "utf8");
}

describe("static-plus-Vercel-adapter deployment configuration", () => {
  it("keeps static output with the Vercel adapter and an env-sourced site URL", async () => {
    const config = await readWorkspaceFile("apps/site/astro.config.mjs");

    expect(config).toContain('import vercel from "@astrojs/vercel"');
    expect(config).toContain("adapter: vercel()");
    expect(config).toContain('base: "/"');
    expect(config).toContain('output: "static"');
    expect(config).toContain('format: "directory"');
    expect(config).toMatch(/process\.env\[["']SITE_URL["']\]/);
    // The public domain is not finalized; it must never be a hardcoded
    // guess, and specifically never the retired GitHub Pages domain.
    expect(config).not.toContain("diegoaleyvag.github.io");
  });

  it("documents SITE_URL, the Groq provider seam, and no other retired variables in .env.example", async () => {
    const envExample = await readWorkspaceFile(".env.example");

    expect(envExample).toContain("SITE_URL");
    // GROQ_API_KEY/GROQ_MODEL are the current, intentional Ask Diego
    // provider seam (C9A) — reused here, not retired. Only the older,
    // unrelated demo/tournament-era variables stay banned.
    expect(envExample).toContain("GROQ_MODEL");
    expect(envExample).toContain("GROQ_API_KEY");
    for (const retiredVariable of [
      "AI_GUIDE_MODEL",
      "AI_GUIDE_API_KEY",
      "AI_GUIDE_BASE_URL",
      "LLM_PROVIDER",
      "LIVE_EXECUTION_ENABLED",
      "DEMO_MODE",
    ]) {
      expect(envExample).not.toContain(retiredVariable);
    }
  });

  it("runs CI on pull requests without deployment authority", async () => {
    const workflow = await readWorkspaceFile(".github/workflows/ci.yml");

    expect(workflow).toMatch(/\bon:\n\s+pull_request:/u);
    expect(workflow).toContain("pnpm ci:gate");
    expect(workflow).not.toContain("actions/deploy-pages");
    expect(workflow).not.toContain("actions/upload-pages-artifact");
    expect(workflow).not.toContain("pages: write");
    expect(workflow).not.toContain("id-token: write");
    expect(workflow).not.toMatch(/vercel/iu);
  });

  it("no longer ships a GitHub Pages deploy workflow", async () => {
    await expect(
      readWorkspaceFile(".github/workflows/pages.yml"),
    ).rejects.toThrow();
  });

  it("pins every third-party action to a full commit SHA", async () => {
    const workflow = await readWorkspaceFile(".github/workflows/ci.yml");
    const uses = [...workflow.matchAll(/\buses:\s+([^\s#]+)/gu)].map(
      ([, reference]) => reference,
    );

    expect(uses.length).toBeGreaterThan(0);
    for (const reference of uses) {
      expect(reference).toMatch(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/u);
    }
  });

  it("ignores Astro's generated type cache and the Vercel build output consistently", async () => {
    const [gitignore, eslintConfig] = await Promise.all([
      readWorkspaceFile(".gitignore"),
      readWorkspaceFile("eslint.config.mjs"),
    ]);

    expect(gitignore).toContain("**/.astro/");
    expect(gitignore).toContain(".vercel/");
    expect(eslintConfig).toContain('"**/.astro/"');
    expect(eslintConfig).toContain('"apps/site/.vercel/**"');
  });
});
