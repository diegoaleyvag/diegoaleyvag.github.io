import { tryResolveRepositoryFile } from "./repo";
import { readFile } from "node:fs/promises";

/**
 * The CV-sync summary (`apps/site/public/downloads/cv/summary.json`) is
 * derived from the *external* CV repository by `pnpm cv:sync`, so its
 * wording may differ slightly from `content/source/cv.yaml` — both are
 * legitimate sources, but the résumé page's HTML transcription reads only
 * from this file so the transcription and the downloadable PDF can never
 * disagree (content.mdc).
 */
export interface CvSyncLink {
  readonly label: string;
  readonly url: string;
}

export interface CvSyncExperience {
  readonly organisation: string;
  readonly role: string;
  readonly dates: string;
  readonly location: string;
  readonly bullets: readonly string[];
}

export interface CvSyncProject {
  readonly name: string;
  readonly descriptor: string;
  readonly dates: string;
  readonly bullets: readonly string[];
}

export interface CvSyncEducation {
  readonly institution: string;
  readonly credential: string;
  readonly dates: string;
  readonly location: string;
  readonly detail: string;
}

export interface CvSyncSkill {
  readonly label: string;
  readonly value: string;
}

export interface CvSyncSummary {
  readonly name: string;
  readonly headline: string;
  readonly location: string;
  readonly availability: string;
  readonly email: string;
  readonly linkedin: CvSyncLink;
  readonly github: CvSyncLink;
  readonly summary: string;
  readonly experience: readonly CvSyncExperience[];
  readonly projects: readonly CvSyncProject[];
  readonly education: readonly CvSyncEducation[];
  readonly skills: readonly CvSyncSkill[];
  readonly certifications: readonly string[];
}

export interface CvSyncManifestFile {
  readonly path: string;
  readonly sha256: string;
}

export interface CvSyncManifest {
  readonly schemaVersion: string;
  readonly sourceCommit: string;
  readonly syncedAt: string;
  readonly files: readonly CvSyncManifestFile[];
  readonly preview: {
    readonly path: string;
    readonly sha256: string;
    readonly rasterizer: string;
  } | null;
  readonly previewUnavailableReason: string | null;
}

const SUMMARY_PATH = "apps/site/public/downloads/cv/summary.json";
const MANIFEST_PATH = "apps/site/public/downloads/cv/manifest.json";
export const CV_DOWNLOAD_PDF_PATH = "/downloads/cv/diego-leyva-cv.pdf";
export const CV_PREVIEW_IMAGE_PATH = "/downloads/cv/preview.png";

export interface LoadedCvSync {
  readonly available: true;
  readonly summary: CvSyncSummary;
  readonly manifest: CvSyncManifest;
}

export interface UnavailableCvSync {
  readonly available: false;
}

/**
 * Never throws: a missing or unreadable `summary.json` is an honest
 * "not yet synced" product state (content.mdc), not a build failure. Every
 * résumé page must branch on `available` rather than assume the sync ran.
 */
export async function loadCvSync(): Promise<LoadedCvSync | UnavailableCvSync> {
  const summaryPath = await tryResolveRepositoryFile(SUMMARY_PATH);
  const manifestPath = await tryResolveRepositoryFile(MANIFEST_PATH);
  if (summaryPath === null || manifestPath === null) {
    return { available: false };
  }

  try {
    const [summaryRaw, manifestRaw] = await Promise.all([
      readFile(summaryPath, "utf8"),
      readFile(manifestPath, "utf8"),
    ]);
    const summary = JSON.parse(summaryRaw) as CvSyncSummary;
    const manifest = JSON.parse(manifestRaw) as CvSyncManifest;
    if (
      typeof summary.name !== "string" ||
      typeof summary.headline !== "string" ||
      !Array.isArray(summary.experience)
    ) {
      return { available: false };
    }
    return { available: true, summary, manifest };
  } catch {
    return { available: false };
  }
}
