import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

import { syncCv } from "./sync.ts";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

export const DEFAULT_CV_SYNC_OUTPUT_DIRECTORY = path.join(
  workspaceRoot,
  "apps",
  "site",
  "public",
  "downloads",
  "cv",
);

interface ParsedArguments {
  readonly sourceDirectory: string;
  readonly outputDirectory: string;
}

function parseArguments(argv: readonly string[]): ParsedArguments {
  let source: string | undefined;
  let output = DEFAULT_CV_SYNC_OUTPUT_DIRECTORY;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source") {
      const value = argv[index + 1];
      if (value === undefined || value === "") {
        throw new Error("--source requires a directory");
      }
      source = value;
      index += 1;
    } else if (argument === "--output") {
      const value = argv[index + 1];
      if (value === undefined || value === "") {
        throw new Error("--output requires a directory");
      }
      output = path.resolve(process.cwd(), value);
      index += 1;
    } else {
      throw new Error(
        `Unrecognized argument: ${argument}. Usage: cv:sync --source "<path>" [--output <directory>]`,
      );
    }
  }

  if (source === undefined) {
    throw new Error(
      'cv:sync requires an explicit --source "<path to the separate CV repository>". It never hardcodes a path and never clones or fetches a remote.',
    );
  }

  return {
    sourceDirectory: path.resolve(process.cwd(), source),
    outputDirectory: output,
  };
}

async function main(): Promise<void> {
  const { sourceDirectory, outputDirectory } = parseArguments(
    process.argv.slice(2),
  );
  const manifest = await syncCv({ sourceDirectory, outputDirectory });

  console.log(
    `Synced CV from ${sourceDirectory} (commit ${manifest.sourceCommit ?? "unknown, not a git repository"}) into ${path.relative(
      workspaceRoot,
      outputDirectory,
    )}`,
  );
  console.log(
    manifest.preview !== null
      ? `Preview generated via ${manifest.preview.rasterizer}: ${manifest.preview.path}`
      : `Preview skipped: ${manifest.previewUnavailableReason ?? "unknown reason"}`,
  );
}

const executable = process.argv[1];
if (
  executable !== undefined &&
  import.meta.url === pathToFileURL(executable).href
) {
  await main();
}
