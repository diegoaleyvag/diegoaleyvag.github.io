import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const fixtureRoot = fileURLToPath(
  new URL("./fixtures/synthetic-cv-repo/", import.meta.url),
);
const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

function runCli(arguments_: readonly string[]): {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
} {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, ...arguments_],
    { cwd: workspaceRoot, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

let temporaryDirectories: string[] = [];

async function createOutputDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "cv-sync-cli-output-"));
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

describe("cv:sync CLI", () => {
  it("fails with a clear message when --source is missing", () => {
    const result = runCli([]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/requires an explicit --source/);
  });

  it("fails on an unrecognized argument", () => {
    const result = runCli(["--bogus"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Unrecognized argument/);
  });

  it("runs end to end against the synthetic fixture and writes a manifest", async () => {
    const outputDirectory = await createOutputDirectory();
    const result = runCli([
      "--source",
      fixtureRoot,
      "--output",
      outputDirectory,
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Synced CV from");

    const manifest = JSON.parse(
      await readFile(path.join(outputDirectory, "manifest.json"), "utf8"),
    );
    expect(manifest.schemaVersion).toBe("1.0.0");
    // The fixture lives inside this repository's own working tree, so
    // `git -C <fixture>` resolves to *this* repo's real HEAD here rather
    // than "not a git repository" — sync.test.ts covers that branch
    // directly against a source copied outside any working tree. This
    // end-to-end test only needs to confirm the field is well-formed.
    expect(
      manifest.sourceCommit === null ||
        /^[0-9a-f]{40}$/.test(manifest.sourceCommit),
    ).toBe(true);
    expect(Array.isArray(manifest.files)).toBe(true);
    expect(manifest.files.length).toBeGreaterThanOrEqual(2);
  }, 30_000);
});
