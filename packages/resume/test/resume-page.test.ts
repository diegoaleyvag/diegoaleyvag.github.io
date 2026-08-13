import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { loadResume } from "../src/index.ts";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
// The Vercel adapter nests Astro's client output under `dist/client/` (see
// tools/check-vercel-output); this reads that direct Astro rendering output
// rather than the copy under `.vercel/output/static/`, keeping this test
// scoped to "does Astro render the résumé correctly" rather than also
// depending on the adapter's separate copy step.
const builtResumeUrl = new URL(
  "../../../apps/site/dist/client/resume/index.html",
  import.meta.url,
);

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(value: string): string {
  const named: Readonly<Record<string, string>> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) => named[name] ?? entity);
}

function textContent(fragment: string): string {
  return decodeHtml(fragment.replace(/<[^>]+>/g, "").trim());
}

beforeAll(() => {
  const pnpmCli = process.env["npm_execpath"];
  if (pnpmCli === undefined) {
    throw new Error("npm_execpath is required to run the static résumé build");
  }

  const result = spawnSync(
    process.execPath,
    [pnpmCli, "--filter", "@portfolio/site", "build"],
    {
      cwd: workspaceRoot,
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Static résumé build failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
}, 30_000);

describe("generated /resume/ route", () => {
  it("binds every publishable source leaf exactly once", async () => {
    const html = await readFile(builtResumeUrl, "utf8");
    const resume = await loadResume();
    const representedPaths: string[] = [];

    for (const match of html.matchAll(/\bdata-source-path="([^"]+)"/g)) {
      const sourcePath = match[1];
      if (sourcePath !== undefined) {
        representedPaths.push(sourcePath);
      }
    }
    for (const match of html.matchAll(/\bdata-source-paths="([^"]+)"/g)) {
      representedPaths.push(...(match[1]?.split(" ") ?? []));
    }

    const representedCounts = new Map<string, number>();
    for (const path of representedPaths) {
      representedCounts.set(path, (representedCounts.get(path) ?? 0) + 1);
    }

    expect([...representedCounts.keys()].sort()).toEqual(
      resume.facts.map(({ path }) => path).sort(),
    );
    expect([...representedCounts.values()].every((count) => count === 1)).toBe(
      true,
    );
  });

  it("renders exact values from typed facts", async () => {
    const html = await readFile(builtResumeUrl, "utf8");
    const resume = await loadResume();
    const combinedLinkPaths = new Set([
      "linkedin.label",
      "linkedin.url",
      "github.label",
      "github.url",
    ]);

    for (const entry of resume.facts) {
      if (combinedLinkPaths.has(entry.path)) {
        continue;
      }

      const path = escapeRegularExpression(entry.path);
      const element = new RegExp(
        `<([a-z0-9]+)[^>]*\\bdata-source-path="${path}"[^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i",
      ).exec(html);

      expect(
        element,
        `missing rendered element for ${entry.path}`,
      ).not.toBeNull();
      expect(textContent(element?.[2] ?? "")).toBe(entry.value);
    }

    for (const link of [
      resume.view.identity.linkedin,
      resume.view.identity.github,
    ]) {
      const paths = `${link.label.path} ${link.url.path}`;
      const anchor = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].find(
        ([, attributes]) =>
          attributes?.includes(`data-source-paths="${paths}"`) ?? false,
      );
      expect(anchor, `missing combined link for ${paths}`).toBeDefined();

      const href = /\bhref="([^"]+)"/.exec(anchor?.[1] ?? "")?.[1] ?? "";
      expect(decodeHtml(href)).toBe(link.url.value);
      expect(textContent(anchor?.[2] ?? "")).toBe(link.label.value);
    }
  });

  it("emits semantic static HTML with print hooks and no client script", async () => {
    const html = await readFile(builtResumeUrl, "utf8");

    expect(html).toContain("<main");
    expect(html).toContain("<article");
    expect(html).toContain("@media print");
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/\.pdf\b/i);
  });
});
