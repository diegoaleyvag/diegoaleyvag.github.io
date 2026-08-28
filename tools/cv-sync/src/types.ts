export interface CvSyncFileRecord {
  readonly path: string;
  readonly sha256: string;
}

export interface CvSyncPreviewRecord {
  readonly path: string;
  readonly sha256: string;
  readonly rasterizer: string;
}

/**
 * `tools/cv-sync`'s manifest: a manual, read-only sync record, never a
 * build-time artifact. `syncedAt` is a real wall-clock timestamp on purpose
 * — this is not a deterministic, CI-gated build like `decisions:build`.
 */
export interface CvSyncManifest {
  readonly schemaVersion: "1.0.0";
  readonly sourceCommit: string | null;
  readonly syncedAt: string;
  readonly files: readonly CvSyncFileRecord[];
  readonly preview: CvSyncPreviewRecord | null;
  readonly previewUnavailableReason: string | null;
}
