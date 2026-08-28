import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { pdftoppmRasterizer, type PdfRasterizer } from "./rasterize.ts";
import { parseExternalCvYaml } from "./schema.ts";
import type { CvSyncManifest } from "./types.ts";

export const CV_SYNC_SCHEMA_VERSION = "1.0.0" as const;

/** Fixed relative layout of the separate CV repository — never a guess, per the owner-confirmed real layout. */
export const SOURCE_CV_YAML_RELATIVE_PATH = path.join(
  "cv",
  "general",
  "cv.yaml",
);
export const SOURCE_CV_PDF_RELATIVE_PATH = path.join(
  "cv",
  "general",
  "diego-leyva-cv.pdf",
);

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function toRepoRelativePath(absolutePath: string): string {
  return path.relative(workspaceRoot, absolutePath).split(path.sep).join("/");
}

/** Read-only: `git rev-parse HEAD` never writes to the source repository. Returns `null` (never throws) when the source isn't a git repository at all — the synthetic test fixture is a plain directory. */
function resolveSourceCommit(sourceDirectory: string): string | null {
  let result;
  try {
    result = spawnSync("git", ["-C", sourceDirectory, "rev-parse", "HEAD"], {
      encoding: "utf8",
    });
  } catch {
    return null;
  }
  if (result.error !== undefined || result.status !== 0) {
    return null;
  }
  const commit = result.stdout.trim();
  return /^[0-9a-f]{40}$/.test(commit) ? commit : null;
}

async function atomicWriteFile(
  destinationPath: string,
  bytes: Uint8Array,
): Promise<void> {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, bytes);
  await rm(destinationPath, { force: true });
  await rename(temporaryPath, destinationPath);
}

export interface SyncCvOptions {
  readonly sourceDirectory: string;
  readonly outputDirectory: string;
  readonly rasterizer?: PdfRasterizer;
  readonly now?: () => Date;
}

/**
 * Manual, read-only sync from the separate CV repository. Reads exactly two
 * files under `sourceDirectory` (never writes there, never clones or
 * fetches anything remote), copies the PDF, derives a public JSON summary
 * from the source repository's own `cv.yaml` (not the portfolio's separate
 * copy), best-effort rasterizes a page-1 preview, and writes a manifest
 * recording the source commit, sync time, file digests, and preview status.
 */
export async function syncCv({
  sourceDirectory,
  outputDirectory,
  rasterizer = pdftoppmRasterizer,
  now = () => new Date(),
}: SyncCvOptions): Promise<CvSyncManifest> {
  const resolvedSource = path.resolve(sourceDirectory);
  const cvYamlPath = path.join(resolvedSource, SOURCE_CV_YAML_RELATIVE_PATH);
  const pdfSourcePath = path.join(resolvedSource, SOURCE_CV_PDF_RELATIVE_PATH);

  const [cvYamlSource, pdfBytes] = await Promise.all([
    readFile(cvYamlPath, "utf8"),
    readFile(pdfSourcePath),
  ]);

  // Validated against tools/cv-sync's own, slightly more permissive schema
  // (see schema.ts) rather than @portfolio/resume's strict portfolio schema:
  // the two repositories are maintained independently and the external file
  // is not guaranteed to carry every optional field the portfolio's own
  // copy does (e.g. `programme`). A genuinely malformed source document
  // still fails loudly; a legitimate, known shape difference does not.
  const cvDocument = parseExternalCvYaml(cvYamlSource);
  const summaryBytes = new TextEncoder().encode(
    `${JSON.stringify(cvDocument, null, 2)}\n`,
  );

  const pdfDestinationPath = path.join(outputDirectory, "diego-leyva-cv.pdf");
  const summaryDestinationPath = path.join(outputDirectory, "summary.json");
  const previewDestinationPath = path.join(outputDirectory, "preview.png");
  const manifestDestinationPath = path.join(outputDirectory, "manifest.json");

  await Promise.all([
    atomicWriteFile(pdfDestinationPath, pdfBytes),
    atomicWriteFile(summaryDestinationPath, summaryBytes),
  ]);

  await rm(previewDestinationPath, { force: true });
  const previewBaseWithoutExtension = previewDestinationPath.replace(
    /\.png$/,
    "",
  );

  let previewRasterized = false;
  let previewUnavailableReason: string | null = null;
  try {
    previewRasterized = await rasterizer.attempt(
      pdfDestinationPath,
      previewBaseWithoutExtension,
    );
  } catch (error) {
    previewUnavailableReason = `Rasterizer "${rasterizer.name}" threw instead of returning false: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
  if (!previewRasterized && previewUnavailableReason === null) {
    previewUnavailableReason = `No working "${rasterizer.name}" rasterizer was available in this environment; preview generation was skipped rather than fabricated.`;
  }

  const files = [
    {
      path: toRepoRelativePath(pdfDestinationPath),
      sha256: sha256Hex(pdfBytes),
    },
    {
      path: toRepoRelativePath(summaryDestinationPath),
      sha256: sha256Hex(summaryBytes),
    },
  ];

  const preview = previewRasterized
    ? {
        path: toRepoRelativePath(previewDestinationPath),
        sha256: sha256Hex(await readFile(previewDestinationPath)),
        rasterizer: rasterizer.name,
      }
    : null;

  const manifest: CvSyncManifest = {
    schemaVersion: CV_SYNC_SCHEMA_VERSION,
    sourceCommit: resolveSourceCommit(resolvedSource),
    syncedAt: now().toISOString(),
    files,
    preview,
    previewUnavailableReason:
      preview === null ? previewUnavailableReason : null,
  };

  await atomicWriteFile(
    manifestDestinationPath,
    new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`),
  );

  return manifest;
}
