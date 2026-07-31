import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { parse, stringify } from "yaml";
import { describe, expect, it } from "vitest";

import {
  loadPublicationConsent,
  loadResume,
  parseCvYaml,
  parsePublicationConsentYaml,
  type CvSourcePath,
} from "../src/index.ts";

const cvUrl = new URL("../../../content/source/cv.yaml", import.meta.url);
const generatedProvenanceUrl = new URL(
  "../generated/resume-provenance.json",
  import.meta.url,
);

interface DerivedLeaf {
  readonly path: string;
  readonly value: string;
}

function deriveLeaves(value: unknown, path = ""): DerivedLeaf[] {
  if (typeof value === "string") {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((child, index) =>
      deriveLeaves(child, `${path}[${index}]`),
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      deriveLeaves(child, path === "" ? key : `${path}.${key}`),
    );
  }
  throw new Error(`Unexpected non-string CV leaf at ${path || "/"}`);
}

describe("canonical CV loader", () => {
  it("preserves source order and every exact UTF-8 leaf", async () => {
    const source = await readFile(cvUrl, "utf8");
    const expected = deriveLeaves(parse(source));
    const loaded = await loadResume();

    expect(loaded.facts.map(({ path, value }) => ({ path, value }))).toEqual(
      expected,
    );
    expect(new Set(loaded.facts.map(({ path }) => path)).size).toBe(
      expected.length,
    );
    expect(Object.isFrozen(loaded.document)).toBe(true);
    expect(Object.isFrozen(loaded.view)).toBe(true);
  });

  it("rejects missing fields without storing a copied CV fixture", async () => {
    const source = await readFile(cvUrl, "utf8");
    const value = parse(source) as Record<string, unknown>;
    delete value["summary"];

    expect(() => parseCvYaml(stringify(value))).toThrow(
      /must have required property 'summary'/,
    );
  });

  it("rejects unknown fields", async () => {
    const source = await readFile(cvUrl, "utf8");
    const value = parse(source) as Record<string, unknown>;
    value["unreviewed_field"] = "not accepted";

    expect(() => parseCvYaml(stringify(value))).toThrow(
      /must NOT have additional properties/,
    );
  });

  it("emits complete deterministic provenance without factual text", async () => {
    const sourceBytes = await readFile(cvUrl);
    const loaded = await loadResume();
    const expectedDigest = createHash("sha256")
      .update(sourceBytes)
      .digest("hex");

    expect(loaded.sourceSha256).toBe(expectedDigest);
    expect(loaded.provenance.source_file_sha256).toBe(expectedDigest);
    expect(
      loaded.provenance.entries.map(({ source_path }) => source_path),
    ).toEqual(loaded.facts.map(({ path }) => path));
    expect(
      loaded.provenance.entries.every(
        ({ source_value_sha256, rendered_value_sha256 }) =>
          source_value_sha256 === rendered_value_sha256,
      ),
    ).toBe(true);

    const generated = JSON.parse(
      await readFile(generatedProvenanceUrl, "utf8"),
    ) as unknown;
    expect(generated).toEqual(loaded.provenance);
    for (const { value } of loaded.facts) {
      expect(JSON.stringify(generated)).not.toContain(value);
    }
  });

  it("resolves typed source paths", async () => {
    const loaded = await loadResume();
    const path = "experience[0].role" satisfies CvSourcePath;

    expect(loaded.fact(path)).toBe(
      loaded.facts.find((entry) => entry.path === path),
    );
  });
});

describe("publication consent gate", () => {
  it("is owner-approved for publication of contact fields", async () => {
    await expect(loadPublicationConsent()).resolves.toEqual({
      schema_version: "1.0.0",
      contact_fields: "approved",
    });
  });

  it("rejects unknown consent fields", () => {
    expect(() =>
      parsePublicationConsentYaml(
        'schema_version: "1.0.0"\ncontact_fields: pending\nbypass: true\n',
      ),
    ).toThrow(/must NOT have additional properties/);
  });
});
