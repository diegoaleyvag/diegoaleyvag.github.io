import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

import {
  buildDecisionsArtifacts,
  type GeneratedDecisionArtifacts,
} from "./builder.ts";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

export const DEFAULT_DECISIONS_OUTPUT_DIRECTORY = path.join(
  workspaceRoot,
  "apps",
  "site",
  "public",
  "decisions",
  "v1",
);

function outputDirectoryFromArguments(arguments_: readonly string[]): string {
  if (arguments_.length === 0) {
    return DEFAULT_DECISIONS_OUTPUT_DIRECTORY;
  }
  if (arguments_.length === 2 && arguments_[0] === "--output") {
    const requested = arguments_[1];
    if (requested === undefined || requested === "") {
      throw new Error("--output requires a directory");
    }
    return path.resolve(process.cwd(), requested);
  }
  throw new Error("Usage: decisions:build [--output <directory>]");
}

/**
 * Atomically replaces `outputDirectory` with freshly built bytes: write to a
 * sibling temp directory, move the existing output aside, promote the temp
 * directory, then discard the backup. A failure at any step restores the
 * original output rather than leaving a half-written directory.
 */
export async function writeDecisionArtifacts(
  artifacts: GeneratedDecisionArtifacts,
  outputDirectory: string,
): Promise<void> {
  const temporaryDirectory = `${outputDirectory}.tmp-${process.pid}`;
  const backupDirectory = `${outputDirectory}.backup-${process.pid}`;

  await rm(temporaryDirectory, { force: true, recursive: true });
  await rm(backupDirectory, { force: true, recursive: true });
  await mkdir(temporaryDirectory, { recursive: true });

  try {
    for (const [relativePath, bytes] of [...artifacts.files].sort(
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

export async function generateDecisionsDirectory(
  outputDirectory: string,
): Promise<GeneratedDecisionArtifacts> {
  const artifacts = await buildDecisionsArtifacts();
  await writeDecisionArtifacts(artifacts, outputDirectory);
  return artifacts;
}

async function main(): Promise<void> {
  const outputDirectory = outputDirectoryFromArguments(process.argv.slice(2));
  const artifacts = await generateDecisionsDirectory(outputDirectory);
  console.log(
    `Generated ${artifacts.manifest.entries.length} Five Decisions manifests in ${path.relative(
      workspaceRoot,
      outputDirectory,
    )}`,
  );
}

const executable = process.argv[1];
if (
  executable !== undefined &&
  import.meta.url === pathToFileURL(executable).href
) {
  await main();
}
