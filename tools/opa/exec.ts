import { spawnSync } from "node:child_process";

import { assertPinnedOpa } from "./tool.ts";

const executablePath = await assertPinnedOpa();
const result = spawnSync(executablePath, process.argv.slice(2), {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: "inherit",
});

if (result.error !== undefined) {
  throw result.error;
}

if (result.signal !== null) {
  throw new Error(`OPA terminated by signal ${result.signal}`);
}

process.exitCode = result.status ?? 1;
