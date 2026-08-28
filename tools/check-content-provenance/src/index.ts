import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  CANONICAL_CV_SOURCE_FILE,
  loadPublicationConsent,
  loadResume,
} from "@portfolio/resume";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const textExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".json",
  ".md",
  ".rego",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const syntheticBoundaries = [
  "packages/decisions/test",
  "packages/resume/test",
  "tests",
  "tools/cv-sync/test",
] as const;

async function listTextFiles(
  relativeDirectory: string,
  relativeChild = "",
): Promise<string[]> {
  const directory = path.join(workspaceRoot, relativeDirectory, relativeChild);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries) {
    const child = path.join(relativeChild, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTextFiles(relativeDirectory, child)));
    } else if (
      entry.isFile() &&
      textExtensions.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(path.join(relativeDirectory, child));
    }
  }
  return files;
}

function assertCanonicalSourceIsUnchangedInGit(): void {
  for (const args of [
    ["diff", "--quiet", "--", CANONICAL_CV_SOURCE_FILE],
    ["diff", "--cached", "--quiet", "--", CANONICAL_CV_SOURCE_FILE],
  ]) {
    const result = spawnSync("git", args, {
      cwd: workspaceRoot,
      encoding: "utf8",
    });
    if (result.status === 1) {
      throw new Error(
        `${CANONICAL_CV_SOURCE_FILE} differs from the checked-in source`,
      );
    }
    if (result.status !== 0) {
      throw new Error(
        `Unable to verify ${CANONICAL_CV_SOURCE_FILE}: ${result.stderr.trim()}`,
      );
    }
  }
}

assertCanonicalSourceIsUnchangedInGit();

const canonicalSourcePath = path.join(workspaceRoot, CANONICAL_CV_SOURCE_FILE);
const sourceBefore = await readFile(canonicalSourcePath);
const resume = await loadResume();
await loadPublicationConsent();

const files = (
  await Promise.all(syntheticBoundaries.map((root) => listTextFiles(root)))
)
  .flat()
  .sort();
const violations: string[] = [];

for (const relativePath of files) {
  const contents = await readFile(
    path.join(workspaceRoot, relativePath),
    "utf8",
  );
  for (const fact of resume.facts) {
    if (contents.includes(fact.value)) {
      violations.push(`${relativePath}: canonical source path ${fact.path}`);
    }
  }
}

const sourceAfter = await readFile(canonicalSourcePath);
if (!sourceAfter.equals(sourceBefore)) {
  throw new Error(`${CANONICAL_CV_SOURCE_FILE} changed while checks ran`);
}
assertCanonicalSourceIsUnchangedInGit();

if (violations.length > 0) {
  throw new Error(
    `Canonical CV values crossed into synthetic/test boundaries:\n${[
      ...new Set(violations),
    ].join("\n")}`,
  );
}

console.log(
  `Content provenance is valid (${resume.facts.length} canonical leaves, source ${resume.sourceSha256})`,
);
