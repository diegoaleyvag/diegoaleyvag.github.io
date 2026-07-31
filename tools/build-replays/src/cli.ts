import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

import { workspaceRoot } from "../../opa/tool.ts";
import {
  buildReplayArtifacts,
  type GeneratedReplayArtifacts,
} from "./builder.ts";
import {
  createOpaPolicyEvaluator,
  type PolicyEvaluator,
} from "./opa-evaluator.ts";

export const DEFAULT_REPLAY_OUTPUT_DIRECTORY = path.join(
  workspaceRoot,
  "apps",
  "site",
  "public",
  "replays",
  "v1",
);

function outputDirectoryFromArguments(arguments_: readonly string[]): string {
  if (arguments_.length === 0) {
    return DEFAULT_REPLAY_OUTPUT_DIRECTORY;
  }
  if (arguments_.length === 2 && arguments_[0] === "--output") {
    const requested = arguments_[1];
    if (requested === undefined || requested === "") {
      throw new Error("--output requires a directory");
    }
    return path.resolve(process.cwd(), requested);
  }
  throw new Error("Usage: replays:build [--output <directory>]");
}

export async function writeReplayArtifacts(
  artifacts: GeneratedReplayArtifacts,
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

export async function generateReplayDirectory(
  evaluatePolicy: PolicyEvaluator,
  outputDirectory: string,
): Promise<GeneratedReplayArtifacts> {
  const artifacts = await buildReplayArtifacts({ evaluatePolicy });
  await writeReplayArtifacts(artifacts, outputDirectory);
  return artifacts;
}

async function main(): Promise<void> {
  const outputDirectory = outputDirectoryFromArguments(process.argv.slice(2));
  const evaluatePolicy = await createOpaPolicyEvaluator();
  const artifacts = await generateReplayDirectory(
    evaluatePolicy,
    outputDirectory,
  );
  console.log(
    `Generated ${artifacts.manifest.entries.length} replay bundles in ${path.relative(
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
