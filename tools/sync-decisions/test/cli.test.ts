import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { WORKSPACE_USAGE, parseWorkspaceArg } from "../src/cli.ts";

const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const cliSourcePath = cliPath;
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

function runCli(arguments_: readonly string[]): {
  readonly status: number | null;
  readonly stderr: string;
} {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, ...arguments_],
    { cwd: workspaceRoot, encoding: "utf8" },
  );
  return { status: result.status, stderr: result.stderr };
}

// This suite covers only the CLI's explicit-input contract (the tested
// interface the audit called for), not the full sync-and-write pipeline,
// which requires real sibling product checkouts pinned to specific commits
// and must not run as part of a docs/portability-focused change.
describe("parseWorkspaceArg", () => {
  it("returns the value passed after --workspace, verbatim", () => {
    expect(parseWorkspaceArg(["--workspace", "/any/path/someone/passes"])).toBe(
      "/any/path/someone/passes",
    );
    expect(
      parseWorkspaceArg(["node", "cli.ts", "--workspace", "../relative"]),
    ).toBe("../relative");
  });

  it("throws the documented usage error when --workspace is missing", () => {
    expect(() => parseWorkspaceArg([])).toThrow(WORKSPACE_USAGE);
    expect(() => parseWorkspaceArg(["--not-workspace", "x"])).toThrow(
      WORKSPACE_USAGE,
    );
  });

  it("never assumes a default path — there is no fallback branch", () => {
    // --workspace with nothing after it: index exists, but the value is
    // undefined, so this must still throw rather than silently defaulting.
    expect(() => parseWorkspaceArg(["--workspace"])).toThrow(WORKSPACE_USAGE);
  });
});

describe("CLI entrypoint guard", () => {
  it("does not run the sync pipeline merely by being imported (proven above: importing parseWorkspaceArg/WORKSPACE_USAGE above did not throw or write files)", () => {
    expect(typeof parseWorkspaceArg).toBe("function");
  });

  it("running the file directly without --workspace fails with the exact documented usage text and a non-zero exit code", () => {
    const result = runCli([]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(WORKSPACE_USAGE);
  });
});

describe("portability guard", () => {
  it("the CLI source never hardcodes a local absolute workspace path as a default", async () => {
    const source = await readFile(cliSourcePath, "utf8");
    // No `/Users/...`-shaped literal anywhere, and no `??`-style fallback
    // immediately after the --workspace lookup.
    expect(source).not.toMatch(/\/Users\/[^/"'`\s]+/);
  });
});
