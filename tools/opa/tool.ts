import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { arch, platform } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import rawManifest from "./manifest.json" with { type: "json" };

interface OpaBinary {
  readonly asset: string;
  readonly sha256: string;
}

interface OpaManifest {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly releaseUrl: string;
  readonly baseDownloadUrl: string;
  readonly binaries: Readonly<Record<string, OpaBinary>>;
}

export const opaManifest = rawManifest as OpaManifest;

export const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));

export function selectedOpaBinary(): OpaBinary {
  const key = `${platform}-${arch}`;
  const binary = opaManifest.binaries[key];

  if (binary === undefined) {
    throw new Error(
      `OPA ${opaManifest.version} has no pinned binary for ${key}. Supported targets: ${Object.keys(
        opaManifest.binaries,
      ).join(", ")}`,
    );
  }

  return binary;
}

export function pinnedOpaPath(): string {
  const executable = platform === "win32" ? "opa.exe" : "opa";
  return path.join(
    workspaceRoot,
    ".cache",
    "tools",
    "opa",
    opaManifest.version,
    executable,
  );
}

export async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

export async function assertPinnedOpa(): Promise<string> {
  const binary = selectedOpaBinary();
  const executablePath = pinnedOpaPath();
  let digest: string;

  try {
    digest = await sha256File(executablePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `Pinned OPA is not installed. Run "pnpm opa:bootstrap" first.`,
        { cause: error },
      );
    }
    throw error;
  }

  if (digest !== binary.sha256) {
    throw new Error(
      `Pinned OPA checksum mismatch at ${executablePath}: expected ${binary.sha256}, received ${digest}`,
    );
  }

  return executablePath;
}
