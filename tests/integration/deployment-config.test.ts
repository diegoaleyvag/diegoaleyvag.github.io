import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const workspaceUrl = new URL("../../", import.meta.url);

async function readWorkspaceFile(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, workspaceUrl), "utf8");
}

describe("static Pages integration", () => {
  it("pins Astro to the canonical root-site static configuration", async () => {
    const config = await readWorkspaceFile("apps/site/astro.config.mjs");

    expect(config).toContain('site: "https://diegoaleyvag.github.io"');
    expect(config).toContain('base: "/"');
    expect(config).toContain('output: "static"');
    expect(config).toContain('format: "directory"');
  });

  it("runs CI on pull requests without deployment authority", async () => {
    const workflow = await readWorkspaceFile(".github/workflows/ci.yml");

    expect(workflow).toMatch(/\bon:\n\s+pull_request:/u);
    expect(workflow).toContain("pnpm ci:gate");
    expect(workflow).not.toContain("actions/deploy-pages");
    expect(workflow).not.toContain("pages: write");
    expect(workflow).not.toContain("id-token: write");
  });

  it("deploys only main pushes after the file-based consent gate", async () => {
    const workflow = await readWorkspaceFile(".github/workflows/pages.yml");
    const consentIndex = workflow.indexOf("pnpm publication:check");
    const uploadIndex = workflow.indexOf("actions/upload-pages-artifact@");

    expect(workflow).toMatch(/\bon:\n\s+push:\n\s+branches:\n\s+- main\n/u);
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("workflow_dispatch:");
    expect(workflow).toContain(
      "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    );
    expect(consentIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(consentIndex);
    expect(workflow).toContain("path: apps/site/dist");
    expect(workflow).toContain("include-hidden-files: true");
    expect(workflow.match(/pages: write/gu)).toHaveLength(1);
    expect(workflow.match(/id-token: write/gu)).toHaveLength(1);
  });

  it("pins every third-party action to a full commit SHA", async () => {
    for (const workflowPath of [
      ".github/workflows/ci.yml",
      ".github/workflows/pages.yml",
    ]) {
      const workflow = await readWorkspaceFile(workflowPath);
      const uses = [...workflow.matchAll(/\buses:\s+([^\s#]+)/gu)].map(
        ([, reference]) => reference,
      );

      expect(uses.length).toBeGreaterThan(0);
      for (const reference of uses) {
        expect(reference).toMatch(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/u);
      }
    }
  });

  it("ignores Astro's generated type cache consistently", async () => {
    const [gitignore, eslintConfig] = await Promise.all([
      readWorkspaceFile(".gitignore"),
      readWorkspaceFile("eslint.config.mjs"),
    ]);

    expect(gitignore).toContain("**/.astro/");
    expect(eslintConfig).toContain('"**/.astro/"');
  });
});
