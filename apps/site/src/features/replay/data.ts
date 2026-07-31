import { loadReplayBundle, loadReplayManifest } from "@portfolio/replay";
import type {
  ReplayManifest,
  ReplayManifestEntry,
  RunBundle,
} from "@portfolio/contracts";

import { SCENARIO_ID, type VariantId } from "./types";

/** Loads and schema-validates the static replay manifest. Same-origin only. */
export async function fetchManifest(): Promise<ReplayManifest> {
  return loadReplayManifest();
}

export function findVariantEntry(
  manifest: ReplayManifest,
  variant: VariantId,
): ReplayManifestEntry {
  const entry = manifest.entries.find(
    (candidate) =>
      candidate.scenario_id === SCENARIO_ID && candidate.variant === variant,
  );
  if (entry === undefined) {
    throw new Error(
      `No manifest entry for scenario ${SCENARIO_ID} variant ${variant}`,
    );
  }
  return entry;
}

/**
 * Fetches the bundle bytes for `entry`, verifies exact byte length and
 * SHA-256 against the manifest, then parses and schema-validates it. Throws
 * (fails closed) on any mismatch instead of rendering unverified data.
 */
export async function fetchBundle(
  entry: ReplayManifestEntry,
): Promise<RunBundle> {
  return loadReplayBundle(entry);
}
