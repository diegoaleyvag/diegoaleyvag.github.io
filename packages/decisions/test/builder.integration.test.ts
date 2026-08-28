import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDecisionsArtifacts,
  type GeneratedDecisionArtifacts,
} from "../../../tools/build-decisions/src/builder.ts";
import { writeDecisionArtifacts } from "../../../tools/build-decisions/src/cli.ts";
import { parseDecisionManifestJson } from "../src/loader.ts";

let cachedArtifacts: Promise<GeneratedDecisionArtifacts> | undefined;

function actualArtifacts(): Promise<GeneratedDecisionArtifacts> {
  cachedArtifacts ??= buildDecisionsArtifacts();
  return cachedArtifacts;
}

describe("deterministic decisions builder", () => {
  it("builds one file per published decision plus a manifest", async () => {
    const artifacts = await actualArtifacts();

    expect([...artifacts.files.keys()].sort()).toEqual([
      "axiom.json",
      "limen.json",
      "manifest.json",
      "prism.json",
      "relay.json",
      "vector.json",
    ]);
    expect(artifacts.manifest.entries.map(({ id }) => id).sort()).toEqual(
      ["axiom", "limen", "prism", "relay", "vector"].sort(),
    );
  });

  it("writes schema-valid, re-parseable manifest bytes for every entry", async () => {
    const artifacts = await actualArtifacts();

    for (const entry of artifacts.manifest.entries) {
      const bytes = artifacts.files.get(`${entry.id}.json`);
      expect(bytes).toBeDefined();
      const parsed = parseDecisionManifestJson(new TextDecoder().decode(bytes));
      expect(parsed.id).toBe(entry.id);
    }
  });

  it("records exact byte lengths and SHA-256 digests", async () => {
    const artifacts = await actualArtifacts();

    for (const entry of artifacts.manifest.entries) {
      const bytes = artifacts.files.get(`${entry.id}.json`);
      expect(bytes?.byteLength).toBe(entry.byteLength);
    }
  });

  it("regenerates byte-for-byte identically", async () => {
    const first = await actualArtifacts();
    const second = await buildDecisionsArtifacts();

    expect([...second.files.keys()]).toEqual([...first.files.keys()]);
    for (const [relativePath, bytes] of first.files) {
      expect(second.files.get(relativePath)).toEqual(bytes);
    }
  });

  it("canonicalizes output field order for a re-ordered but equivalent source object", async () => {
    const reordered = parseDecisionManifestJson(
      JSON.stringify({
        links: { methodology: null, demo: null, repository: null },
        evidence: [],
        capabilities: [],
        summary: "One factual sentence.",
        status: "building",
        buildStarted: "2026-08-13",
        learningOrigin: "2026-05",
        decision: "When is a model good enough?",
        title: "Prism",
        id: "prism",
        collection: "five-decisions",
        schemaVersion: "1.0.0",
      }),
    );
    const artifacts = await actualArtifacts();
    const canonicalBytes = artifacts.files.get("prism.json");

    expect(Object.keys(JSON.parse(JSON.stringify(reordered)))).not.toEqual(
      Object.keys(JSON.parse(new TextDecoder().decode(canonicalBytes))),
    );
    expect(
      Object.keys(JSON.parse(new TextDecoder().decode(canonicalBytes))),
    ).toEqual([
      "schemaVersion",
      "collection",
      "id",
      "title",
      "decision",
      "learningOrigin",
      "buildStarted",
      "status",
      "summary",
      "capabilities",
      "evidence",
      "links",
    ]);
  });

  it("atomically replaces an existing output directory wholesale", async () => {
    const temporaryRoot = await mkdtemp(
      path.join(tmpdir(), "synthetic-decisions-builder-"),
    );
    const outputDirectory = path.join(temporaryRoot, "v1");
    const staleSentinelPath = path.join(outputDirectory, "sentinel.txt");
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(staleSentinelPath, "stale synthetic output\n", "utf8");

    const artifacts = await actualArtifacts();
    try {
      await writeDecisionArtifacts(artifacts, outputDirectory);
      // A full replace, not a merge: the stale file from the pre-existing
      // directory must not survive into the freshly written one.
      await expect(access(staleSentinelPath)).rejects.toThrow();
      const written = await readFile(
        path.join(outputDirectory, "manifest.json"),
        "utf8",
      );
      expect(written).toContain('"collection": "five-decisions"');
    } finally {
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });
});
