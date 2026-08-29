import { readFile, readdir } from "node:fs/promises";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

import { loadResume } from "@portfolio/resume";

const contentSiteUrl = new URL("../../content/site/", import.meta.url);
const bilingualFiles = [
  "hero.yaml",
  "map.yaml",
  "education.yaml",
  "about.yaml",
  "contact.yaml",
  "archive.yaml",
] as const;

async function readSiteYaml(fileName: string): Promise<unknown> {
  const source = await readFile(new URL(fileName, contentSiteUrl), "utf8");
  return parse(source);
}

/** Every leaf path in source order; throws on a non-string, non-container leaf. */
function collectLeafPaths(value: unknown, path = ""): string[] {
  if (typeof value === "string") {
    if (value.length === 0) {
      throw new Error(`Empty string leaf at ${path || "/"}`);
    }
    return [path];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectLeafPaths(item, `${path}[${index}]`),
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .flatMap((key) =>
        collectLeafPaths(
          (value as Record<string, unknown>)[key],
          path === "" ? key : `${path}.${key}`,
        ),
      );
  }
  throw new Error(
    `Unexpected non-string leaf at ${path || "/"}: ${String(value)}`,
  );
}

describe("bilingual site content", () => {
  it("only ships the documented section files, each valid YAML", async () => {
    const entries = (
      await readdir(contentSiteUrl, { withFileTypes: true })
    ).filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"));

    expect(entries.map((entry) => entry.name).sort()).toEqual(
      [...bilingualFiles, "credentials.yaml", "decisions.yaml"].sort(),
    );
  });

  it.each(bilingualFiles)(
    "gives %s identical EN/ES structure with no empty leaf",
    async (fileName) => {
      const document = (await readSiteYaml(fileName)) as Record<
        string,
        unknown
      >;

      expect(Object.keys(document).sort()).toEqual(["en", "es"]);
      const enShape = collectLeafPaths(document["en"]);
      const esShape = collectLeafPaths(document["es"]);
      expect(esShape).toEqual(enShape);
    },
  );

  it("keeps the fixed English hero positioning verbatim from PRODUCT.md", async () => {
    const hero = (await readSiteYaml("hero.yaml")) as {
      en: { tagline: string; subtitle: string };
    };

    expect(hero.en.tagline).toBe("Data Science student · AI systems builder");
    expect(hero.en.subtitle).toBe(
      "I turn difficult questions into useful, testable systems.",
    );
  });

  it("never mirrors the English hero line into Spanish word-for-word", async () => {
    const hero = (await readSiteYaml("hero.yaml")) as {
      en: { tagline: string; subtitle: string };
      es: { tagline: string; subtitle: string };
    };

    expect(hero.es.tagline).not.toBe(hero.en.tagline);
    expect(hero.es.subtitle).not.toBe(hero.en.subtitle);
  });

  it("names the same five map domains, in the same order, in both languages", async () => {
    const map = (await readSiteYaml("map.yaml")) as {
      en: { domains: { id: string }[] };
      es: { domains: { id: string }[] };
    };
    const ids = map.en.domains.map((domain) => domain.id);

    expect(ids).toEqual([
      "data",
      "applied-ai",
      "systems",
      "product",
      "learning",
    ]);
    expect(map.es.domains.map((domain) => domain.id)).toEqual(ids);
  });

  it("names the same three archived projects, in the same order, in both languages", async () => {
    const archive = (await readSiteYaml("archive.yaml")) as {
      en: { projects: { id: string; name: string; status: string }[] };
      es: { projects: { id: string; name: string; status: string }[] };
    };

    const ids = archive.en.projects.map((project) => project.id);
    expect(ids).toEqual([
      "fridgeguard",
      "nutritional-assistant",
      "urban-threads",
    ]);
    expect(archive.es.projects.map((project) => project.id)).toEqual(ids);
    for (const language of [archive.en, archive.es]) {
      for (const project of language.projects) {
        expect(project.status.toLowerCase()).toMatch(
          /archiv|no.*(demo|live)|archived/,
        );
      }
    }
  });
});

describe("decisions.yaml", () => {
  async function readDecisionNarratives(): Promise<
    Record<
      string,
      {
        en: { decision: string; summary: string };
        es: { decision: string; summary: string };
      }
    >
  > {
    const source = await readFile(
      new URL("decisions.yaml", contentSiteUrl),
      "utf8",
    );
    return parse(source);
  }

  it("carries a bilingual narrative for every real decision manifest, matching its English fact", async () => {
    const narratives = await readDecisionNarratives();
    const decisionsDirectory = new URL(
      "../../content/decisions/",
      import.meta.url,
    );
    const ids = (await readdir(decisionsDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(Object.keys(narratives).sort()).toEqual(ids);

    for (const id of ids) {
      const manifestSource = await readFile(
        new URL(`${id}/portfolio.project.json`, decisionsDirectory),
        "utf8",
      );
      const manifest = JSON.parse(manifestSource) as {
        decision: string;
        summary: string;
      };
      const narrative = narratives[id];
      expect(narrative).toBeDefined();
      expect(narrative?.en.decision).toBe(manifest.decision);
      expect(narrative?.en.summary).toBe(manifest.summary);
      expect(narrative?.es.decision).not.toBe(manifest.decision);
      expect(narrative?.es.summary).not.toBe(manifest.summary);
    }
  });
});

describe("credentials.yaml", () => {
  async function readCredentials(): Promise<{
    schemaVersion: string;
    verified: readonly {
      name: string;
      issuer: string;
      level: string;
      issued: string;
      expires: string;
      url: string;
    }[];
    terse: readonly { label: string; sourcePath: string }[];
  }> {
    const source = await readFile(
      new URL("credentials.yaml", contentSiteUrl),
      "utf8",
    );
    return parse(source);
  }

  it("never publishes a score for a verified credential", async () => {
    const credentials = await readCredentials();
    const serialized = JSON.stringify(credentials).toLowerCase();

    expect(serialized).not.toMatch(/score/);
    expect(serialized).not.toMatch(/percent/);
  });

  it("only cites the Anthropic Credly badges the owner confirmed live", async () => {
    const credentials = await readCredentials();

    expect(credentials.verified).toHaveLength(2);
    for (const credential of credentials.verified) {
      expect(credential.issuer).toBe("Anthropic");
      expect(credential.url).toMatch(
        /^https:\/\/www\.credly\.com\/badges\/[0-9a-f-]{36}$/,
      );
      const issued = Date.parse(credential.issued);
      const expires = Date.parse(credential.expires);
      expect(Number.isNaN(issued)).toBe(false);
      expect(Number.isNaN(expires)).toBe(false);
      expect(expires).toBeGreaterThan(issued);
    }
    expect(credentials.verified.map((entry) => entry.level)).toEqual([
      "Foundations",
      "Professional",
    ]);
  });

  it("carries the three existing cv.yaml certification strings through unchanged", async () => {
    const credentials = await readCredentials();
    const resume = await loadResume();

    expect(credentials.terse).toHaveLength(
      resume.document.certifications.length,
    );
    // Compared against content/source/cv.yaml at test time, not a hardcoded
    // snapshot, so a future edit to the read-only source fails this test
    // loudly instead of letting credentials.yaml drift silently out of sync.
    credentials.terse.forEach((entry, index) => {
      expect(entry.sourcePath).toBe(`certifications[${index}]`);
      expect(entry.label).toBe(resume.document.certifications[index]);
    });
  });
});
