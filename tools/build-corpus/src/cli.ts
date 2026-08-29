import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

import {
  CORPUS_BUNDLE_FILE_NAME,
  buildCorpusArtifacts,
  type GeneratedCorpusArtifacts,
} from "./builder.ts";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

export const DEFAULT_CORPUS_OUTPUT_DIRECTORY = path.join(
  workspaceRoot,
  "apps",
  "site",
  "public",
  "corpus",
  "v1",
);

export const DEFAULT_CORPUS_BUNDLE_PATH = path.join(
  workspaceRoot,
  "packages",
  "ask-corpus",
  "generated",
  CORPUS_BUNDLE_FILE_NAME,
);

/**
 * Atomically replaces `outputDirectory` with freshly built bytes: write to a
 * sibling temp directory, move the existing output aside, promote the temp
 * directory, then discard the backup. Mirrors
 * `tools/build-decisions/src/cli.ts`'s `writeDecisionArtifacts`.
 */
export async function writeCorpusPublicArtifacts(
  publicFiles: GeneratedCorpusArtifacts["publicFiles"],
  outputDirectory: string,
): Promise<void> {
  const temporaryDirectory = `${outputDirectory}.tmp-${process.pid}`;
  const backupDirectory = `${outputDirectory}.backup-${process.pid}`;

  await rm(temporaryDirectory, { force: true, recursive: true });
  await rm(backupDirectory, { force: true, recursive: true });
  await mkdir(temporaryDirectory, { recursive: true });

  try {
    for (const [relativePath, bytes] of [...publicFiles].sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      const outputPath = path.join(temporaryDirectory, relativePath);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, bytes);
    }

    let movedExistingOutput = false;
    try {
      await rename(outputDirectory, backupDirectory);
      movedExistingOutput = true;
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      )) {
        throw error;
      }
    }

    try {
      await rename(temporaryDirectory, outputDirectory);
      await rm(backupDirectory, { force: true, recursive: true });
    } catch (error) {
      if (movedExistingOutput) {
        await rename(backupDirectory, outputDirectory);
      }
      throw error;
    }
  } catch (error) {
    await rm(temporaryDirectory, { force: true, recursive: true });
    throw error;
  }
}

/** Atomic single-file write: temp file next to the target, then rename over it. */
export async function writeCorpusBundle(
  bundleBytes: Uint8Array,
  bundlePath: string,
): Promise<void> {
  const temporaryPath = `${bundlePath}.tmp-${process.pid}`;
  await mkdir(path.dirname(bundlePath), { recursive: true });
  await writeFile(temporaryPath, bundleBytes);
  await rm(bundlePath, { force: true });
  await rename(temporaryPath, bundlePath);
}

export async function generateCorpusArtifacts(
  outputDirectory: string,
  bundlePath: string,
): Promise<GeneratedCorpusArtifacts> {
  const artifacts = await buildCorpusArtifacts();
  await writeCorpusPublicArtifacts(artifacts.publicFiles, outputDirectory);
  await writeCorpusBundle(artifacts.bundleBytes, bundlePath);
  return artifacts;
}

async function main(): Promise<void> {
  const artifacts = await generateCorpusArtifacts(
    DEFAULT_CORPUS_OUTPUT_DIRECTORY,
    DEFAULT_CORPUS_BUNDLE_PATH,
  );
  console.log(
    `Generated ${artifacts.manifest.entries.length} Ask Diego corpus entries in ${path.relative(
      workspaceRoot,
      DEFAULT_CORPUS_OUTPUT_DIRECTORY,
    )} and ${path.relative(workspaceRoot, DEFAULT_CORPUS_BUNDLE_PATH)}`,
  );
}

const executable = process.argv[1];
if (
  executable !== undefined &&
  import.meta.url === pathToFileURL(executable).href
) {
  await main();
}
