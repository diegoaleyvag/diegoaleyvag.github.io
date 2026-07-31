import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { buildReplayArtifacts } from "./builder.ts";
import { DEFAULT_REPLAY_OUTPUT_DIRECTORY } from "./cli.ts";
import { createOpaPolicyEvaluator } from "./opa-evaluator.ts";

async function listFiles(
  directory: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

const evaluatePolicy = await createOpaPolicyEvaluator();
const generated = await buildReplayArtifacts({ evaluatePolicy });
const expectedPaths = [...generated.files.keys()].sort();
const actualPaths = await listFiles(DEFAULT_REPLAY_OUTPUT_DIRECTORY);

if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
  throw new Error(
    `Generated replay file set drifted: expected ${expectedPaths.join(", ")}, received ${actualPaths.join(", ")}`,
  );
}

for (const relativePath of expectedPaths) {
  const expected = generated.files.get(relativePath);
  if (expected === undefined) {
    throw new Error(`Builder omitted expected bytes for ${relativePath}`);
  }
  const actual = await readFile(
    path.join(DEFAULT_REPLAY_OUTPUT_DIRECTORY, relativePath),
  );
  if (!actual.equals(Buffer.from(expected))) {
    throw new Error(`Generated replay bytes drifted for ${relativePath}`);
  }
}

console.log(
  `Generated replay artifacts are current (${generated.manifest.entries
    .map(({ variant, sha256 }) => `${variant}:${sha256}`)
    .join(", ")})`,
);
