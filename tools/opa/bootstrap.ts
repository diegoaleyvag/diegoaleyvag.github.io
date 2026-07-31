import { createHash } from "node:crypto";
import { chmod, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  assertPinnedOpa,
  opaManifest,
  pinnedOpaPath,
  selectedOpaBinary,
} from "./tool.ts";

async function bootstrap(): Promise<void> {
  try {
    const installedPath = await assertPinnedOpa();
    console.log(
      `OPA ${opaManifest.version} already verified at ${installedPath}`,
    );
    return;
  } catch {
    // A missing or mismatched cache entry is replaced only after download
    // bytes have passed the pinned checksum.
  }

  const binary = selectedOpaBinary();
  const executablePath = pinnedOpaPath();
  const temporaryPath = `${executablePath}.download`;
  const downloadUrl = `${opaManifest.baseDownloadUrl}/${binary.asset}`;

  await mkdir(path.dirname(executablePath), { recursive: true });
  await rm(temporaryPath, { force: true });

  const response = await fetch(downloadUrl, {
    headers: { "user-agent": "portfolio-opa-bootstrap" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download pinned OPA from ${downloadUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");

  if (digest !== binary.sha256) {
    throw new Error(
      `Downloaded OPA checksum mismatch: expected ${binary.sha256}, received ${digest}`,
    );
  }

  try {
    await writeFile(temporaryPath, bytes, { mode: 0o755 });
    await chmod(temporaryPath, 0o755);
    await rename(temporaryPath, executablePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }

  await assertPinnedOpa();
  console.log(
    `Installed and verified OPA ${opaManifest.version} at ${executablePath}`,
  );
}

await bootstrap();
