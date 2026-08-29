import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

// ADR 0014 relaxed literal/mirror CV rendering (ADR 0005) to an editorial
// résumé companion fed by `pnpm cv:sync`; zero fabrication is now enforced
// by the fact/narrative boundary in AGENTS.md rather than exact-string
// equality against `content/source/cv.yaml`. This test covers the new
// architecture directly: the HTML transcription must come from the
// CV-sync summary (never re-derived from cv.yaml), the download link must
// point at the real synced PDF, and the page must ship no client script.
const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const staticRoot = new URL(
  "../../apps/site/.vercel/output/static/",
  import.meta.url,
);
const summaryUrl = new URL(
  "../../apps/site/public/downloads/cv/summary.json",
  import.meta.url,
);
const manifestUrl = new URL(
  "../../apps/site/public/downloads/cv/manifest.json",
  import.meta.url,
);

interface CvSyncSummary {
  readonly name: string;
  readonly headline: string;
  readonly experience: readonly { readonly organisation: string }[];
  readonly certifications: readonly string[];
}

interface CvSyncManifest {
  readonly sourceCommit: string;
}

/** Matches how Astro's HTML serializer escapes a raw fact string. */
function asRenderedText(value: string): string {
  return value.replace(/&/g, "&amp;");
}

beforeAll(() => {
  const pnpmCli = process.env["npm_execpath"];
  if (pnpmCli === undefined) {
    throw new Error("npm_execpath is required to run the static site build");
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
      `Static site build failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
}, 60_000);

describe("/resume/ and /es/cv/ routes", () => {
  it("transcribes the CV-sync summary, not content/source/cv.yaml directly", async () => {
    const [html, summaryRaw] = await Promise.all([
      readFile(new URL("resume/index.html", staticRoot), "utf8"),
      readFile(summaryUrl, "utf8"),
    ]);
    const summary = JSON.parse(summaryRaw) as CvSyncSummary;

    expect(html).toContain(summary.name);
    expect(html).toContain(summary.headline);
    for (const entry of summary.experience) {
      expect(html).toContain(entry.organisation);
    }
    for (const certification of summary.certifications) {
      expect(html).toContain(asRenderedText(certification));
    }
  });

  it("cites the CV-sync source file and commit as its provenance", async () => {
    const [html, manifestRaw] = await Promise.all([
      readFile(new URL("resume/index.html", staticRoot), "utf8"),
      readFile(manifestUrl, "utf8"),
    ]);
    const manifest = JSON.parse(manifestRaw) as CvSyncManifest;

    expect(html).toContain("apps/site/public/downloads/cv/summary.json");
    expect(html).toContain(manifest.sourceCommit);
  });

  it("links the real downloadable PDF and preview image, ships no client script", async () => {
    const html = await readFile(
      new URL("resume/index.html", staticRoot),
      "utf8",
    );

    expect(html).toContain('href="/downloads/cv/diego-leyva-cv.pdf"');
    expect(html).toContain('src="/downloads/cv/preview.png"');
    expect(html).not.toMatch(/<script\b/i);
  });

  it("gives the Spanish transcription the same facts, genuinely translated", async () => {
    const [enHtml, esHtml, summaryRaw] = await Promise.all([
      readFile(new URL("resume/index.html", staticRoot), "utf8"),
      readFile(new URL("es/cv/index.html", staticRoot), "utf8"),
      readFile(summaryUrl, "utf8"),
    ]);
    const summary = JSON.parse(summaryRaw) as CvSyncSummary;

    // Proper nouns (name, organisation, certification titles) are shared
    // verbatim in both languages (content.mdc: credential titles are proper
    // nouns, not prose); the headline prose itself must genuinely differ.
    expect(esHtml).toContain(summary.name);
    for (const entry of summary.experience) {
      expect(esHtml).toContain(entry.organisation);
    }
    for (const certification of summary.certifications) {
      expect(esHtml).toContain(asRenderedText(certification));
    }
    expect(esHtml).not.toContain(summary.headline);
    expect(enHtml).toContain(summary.headline);
    expect(esHtml).toContain('lang="es"');
  });
});
