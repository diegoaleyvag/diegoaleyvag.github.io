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
  buildCorpusArtifacts,
  type GeneratedCorpusArtifacts,
} from "../../../tools/build-corpus/src/builder.ts";
import {
  writeCorpusBundle,
  writeCorpusPublicArtifacts,
} from "../../../tools/build-corpus/src/cli.ts";
import { parseCorpusEntryJson } from "../src/loader.ts";

let cachedArtifacts: Promise<GeneratedCorpusArtifacts> | undefined;

function actualArtifacts(): Promise<GeneratedCorpusArtifacts> {
  cachedArtifacts ??= buildCorpusArtifacts();
  return cachedArtifacts;
}

describe("deterministic corpus builder", () => {
  it("builds one public file per corpus entry plus a manifest", async () => {
    const artifacts = await actualArtifacts();

    const expectedNames = [
      ...artifacts.loaded.map(({ id }) => `${id}.json`),
      "manifest.json",
    ].sort();
    expect([...artifacts.publicFiles.keys()].sort()).toEqual(expectedNames);
    expect(artifacts.manifest.entries.map(({ id }) => id).sort()).toEqual(
      artifacts.loaded.map(({ id }) => id).sort(),
    );
  });

  it("writes schema-valid, re-parseable bytes for every public entry", async () => {
    const artifacts = await actualArtifacts();

    for (const entry of artifacts.manifest.entries) {
      const bytes = artifacts.publicFiles.get(`${entry.id}.json`);
      expect(bytes).toBeDefined();
      const parsed = parseCorpusEntryJson(new TextDecoder().decode(bytes));
      expect(parsed.id).toBe(entry.id);
    }
  });

  it("records exact byte lengths and SHA-256 digests", async () => {
    const artifacts = await actualArtifacts();

    for (const entry of artifacts.manifest.entries) {
      const bytes = artifacts.publicFiles.get(`${entry.id}.json`);
      expect(bytes?.byteLength).toBe(entry.byteLength);
    }
  });

  it("builds a bundle containing every entry, matching the public files", async () => {
    const artifacts = await actualArtifacts();
    const bundle = JSON.parse(new TextDecoder().decode(artifacts.bundleBytes));

    expect(Array.isArray(bundle)).toBe(true);
    expect(bundle).toHaveLength(artifacts.loaded.length);
    expect(bundle.map((entry: { id: string }) => entry.id).sort()).toEqual(
      artifacts.loaded.map(({ id }) => id).sort(),
    );
  });

  it("regenerates byte-for-byte identically", async () => {
    const first = await actualArtifacts();
    const second = await buildCorpusArtifacts();

    expect([...second.publicFiles.keys()]).toEqual([
      ...first.publicFiles.keys(),
    ]);
    for (const [relativePath, bytes] of first.publicFiles) {
      expect(second.publicFiles.get(relativePath)).toEqual(bytes);
    }
    expect(second.bundleBytes).toEqual(first.bundleBytes);
  });

  it("atomically replaces an existing public output directory wholesale", async () => {
    const temporaryRoot = await mkdtemp(
      path.join(tmpdir(), "synthetic-corpus-builder-"),
    );
    const outputDirectory = path.join(temporaryRoot, "v1");
    const staleSentinelPath = path.join(outputDirectory, "sentinel.txt");
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(staleSentinelPath, "stale synthetic output\n", "utf8");

    const artifacts = await actualArtifacts();
    try {
      await writeCorpusPublicArtifacts(artifacts.publicFiles, outputDirectory);
      await expect(access(staleSentinelPath)).rejects.toThrow();
      const written = await readFile(
        path.join(outputDirectory, "manifest.json"),
        "utf8",
      );
      expect(written).toContain('"collection": "ask-corpus"');
    } finally {
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });

  it("writes the generated bundle file atomically", async () => {
    const temporaryRoot = await mkdtemp(
      path.join(tmpdir(), "synthetic-corpus-bundle-"),
    );
    const bundlePath = path.join(temporaryRoot, "corpus-bundle.json");

    const artifacts = await actualArtifacts();
    try {
      await writeCorpusBundle(artifacts.bundleBytes, bundlePath);
      const written = await readFile(bundlePath, "utf8");
      expect(written).toContain('"collection": "ask-corpus"');
    } finally {
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });
});
