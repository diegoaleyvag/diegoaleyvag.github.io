import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { buildCorpusArtifacts } from "./builder.ts";
import {
  DEFAULT_CORPUS_BUNDLE_PATH,
  DEFAULT_CORPUS_OUTPUT_DIRECTORY,
} from "./cli.ts";

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

const generated = await buildCorpusArtifacts();
const expectedPaths = [...generated.publicFiles.keys()].sort();
const actualPaths = await listFiles(DEFAULT_CORPUS_OUTPUT_DIRECTORY);

if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
  throw new Error(
    `Generated corpus file set drifted: expected ${expectedPaths.join(", ")}, received ${actualPaths.join(", ")}`,
  );
}

for (const relativePath of expectedPaths) {
  const expected = generated.publicFiles.get(relativePath);
  if (expected === undefined) {
    throw new Error(`Builder omitted expected bytes for ${relativePath}`);
  }
  const actual = await readFile(
    path.join(DEFAULT_CORPUS_OUTPUT_DIRECTORY, relativePath),
  );
  if (!actual.equals(Buffer.from(expected))) {
    throw new Error(`Generated corpus bytes drifted for ${relativePath}`);
  }
}

const actualBundle = await readFile(DEFAULT_CORPUS_BUNDLE_PATH);
if (!actualBundle.equals(Buffer.from(generated.bundleBytes))) {
  throw new Error(
    `Generated corpus bundle drifted: ${DEFAULT_CORPUS_BUNDLE_PATH}`,
  );
}

console.log(
  `Generated Ask Diego corpus artifacts are current (${generated.manifest.entries
    .map(({ id, sha256 }) => `${id}:${sha256}`)
    .join(", ")})`,
);
