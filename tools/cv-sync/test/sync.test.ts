import { createHash } from "node:crypto";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { parseCvYaml } from "@portfolio/resume";
import { afterEach, describe, expect, it } from "vitest";

import type { PdfRasterizer } from "../src/rasterize.ts";
import { syncCv } from "../src/sync.ts";

const fixtureRoot = fileURLToPath(
  new URL("./fixtures/synthetic-cv-repo/", import.meta.url),
);
const fixtureCvYamlPath = path.join(fixtureRoot, "cv", "general", "cv.yaml");
const fixturePdfPath = path.join(
  fixtureRoot,
  "cv",
  "general",
  "diego-leyva-cv.pdf",
);
const fixedNow = () => new Date("2026-08-13T12:00:00.000Z");

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function listFilesRecursively(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(entryPath)));
    } else {
      files.push(entryPath);
    }
  }
  return files.sort();
}

const successfulFakeRasterizer: PdfRasterizer = {
  name: "fake-success",
  async attempt(_pdfPath, outputBasePath) {
    await writeFile(`${outputBasePath}.png`, Buffer.from("fake-png-bytes"));
    return true;
  },
};

const unavailableFakeRasterizer: PdfRasterizer = {
  name: "fake-unavailable",
  async attempt() {
    return false;
  },
};

const throwingFakeRasterizer: PdfRasterizer = {
  name: "fake-throws",
  async attempt() {
    throw new Error("synthetic rasterizer failure");
  },
};

let temporaryDirectories: string[] = [];

async function createOutputDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "cv-sync-output-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
  temporaryDirectories = [];
});

describe("syncCv", () => {
  it("copies the PDF byte-for-byte and records its digest", async () => {
    const outputDirectory = await createOutputDirectory();
    const manifest = await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: unavailableFakeRasterizer,
      now: fixedNow,
    });

    const sourceBytes = await readFile(fixturePdfPath);
    const copiedBytes = await readFile(
      path.join(outputDirectory, "diego-leyva-cv.pdf"),
    );
    expect(copiedBytes.equals(sourceBytes)).toBe(true);

    const pdfEntry = manifest.files.find((entry) =>
      entry.path.endsWith("diego-leyva-cv.pdf"),
    );
    expect(pdfEntry?.sha256).toBe(sha256Hex(sourceBytes));
  });

  it("derives summary.json from the source repository's own cv.yaml, not the portfolio's", async () => {
    const outputDirectory = await createOutputDirectory();
    await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: unavailableFakeRasterizer,
      now: fixedNow,
    });

    const expected = parseCvYaml(await readFile(fixtureCvYamlPath, "utf8"));
    const summary = JSON.parse(
      await readFile(path.join(outputDirectory, "summary.json"), "utf8"),
    );
    expect(summary).toEqual(expected);
    expect(summary.name).toBe("Ada Fixture");
  });

  it("records a populated preview when the rasterizer succeeds", async () => {
    const outputDirectory = await createOutputDirectory();
    const manifest = await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: successfulFakeRasterizer,
      now: fixedNow,
    });

    expect(manifest.preview).not.toBeNull();
    expect(manifest.preview?.rasterizer).toBe("fake-success");
    expect(manifest.previewUnavailableReason).toBeNull();
    await expect(
      stat(path.join(outputDirectory, "preview.png")),
    ).resolves.toBeDefined();
  });

  it("degrades to preview: null with a short reason when no rasterizer is available", async () => {
    const outputDirectory = await createOutputDirectory();
    const manifest = await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: unavailableFakeRasterizer,
      now: fixedNow,
    });

    expect(manifest.preview).toBeNull();
    expect(manifest.previewUnavailableReason).toBeTruthy();
    expect(manifest.previewUnavailableReason?.length).toBeLessThan(240);
  });

  it("degrades gracefully instead of throwing when the rasterizer itself throws", async () => {
    const outputDirectory = await createOutputDirectory();
    const manifest = await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: throwingFakeRasterizer,
      now: fixedNow,
    });

    expect(manifest.preview).toBeNull();
    expect(manifest.previewUnavailableReason).toContain(
      "synthetic rasterizer failure",
    );
  });

  it("resolves sourceCommit to null for a source directory that is not a git repository", async () => {
    // The fixture normally lives inside this very git repository, so
    // `git -C <fixture>` would resolve to *this* repo's HEAD instead of
    // exercising the "not a git repository at all" branch. Copying it
    // outside any working tree is what actually tests that branch.
    const outputDirectory = await createOutputDirectory();
    const gitFreeSource = await mkdtemp(
      path.join(tmpdir(), "cv-sync-no-git-source-"),
    );
    temporaryDirectories.push(gitFreeSource);
    await cp(fixtureRoot, gitFreeSource, { recursive: true });

    const manifest = await syncCv({
      sourceDirectory: gitFreeSource,
      outputDirectory,
      rasterizer: unavailableFakeRasterizer,
      now: fixedNow,
    });

    expect(manifest.sourceCommit).toBeNull();
  });

  it("writes a schemaVersion and syncedAt timestamp", async () => {
    const outputDirectory = await createOutputDirectory();
    const manifest = await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: unavailableFakeRasterizer,
      now: fixedNow,
    });

    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(manifest.syncedAt).toBe("2026-08-13T12:00:00.000Z");
  });

  it("never writes into, or otherwise modifies, the source directory", async () => {
    const outputDirectory = await createOutputDirectory();
    const beforeFiles = await listFilesRecursively(fixtureRoot);
    const beforeDigests = await Promise.all(
      beforeFiles.map(async (filePath) => sha256Hex(await readFile(filePath))),
    );

    await syncCv({
      sourceDirectory: fixtureRoot,
      outputDirectory,
      rasterizer: successfulFakeRasterizer,
      now: fixedNow,
    });

    const afterFiles = await listFilesRecursively(fixtureRoot);
    const afterDigests = await Promise.all(
      afterFiles.map(async (filePath) => sha256Hex(await readFile(filePath))),
    );
    expect(afterFiles).toEqual(beforeFiles);
    expect(afterDigests).toEqual(beforeDigests);
  });
});
