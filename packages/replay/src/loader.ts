import {
  assertReplayManifest,
  assertRunBundle,
  type ReplayManifest,
  type ReplayManifestEntry,
  type RunBundle,
} from "@portfolio/contracts";

import { sha256Hex } from "./crypto.ts";

export const REPLAY_MANIFEST_PATH = "/replays/v1/manifest.json" as const;
export const REPLAY_BUNDLE_ROOT_PATH = "/replays/v1/" as const;
export const SYNTHETIC_MAINTENANCE_BUNDLE_ROOT_PATH =
  "/replays/v1/synthetic-maintenance-v1/" as const;

export interface ReplayFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type ReplayFetch = (path: string) => Promise<ReplayFetchResponse>;

export type BundleByteVerification =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "byte_length_mismatch" | "sha256_mismatch";
    };

function assertReplayPath(path: string): void {
  if (
    !path.startsWith(REPLAY_BUNDLE_ROOT_PATH) ||
    path.includes("..") ||
    path.includes("?") ||
    path.includes("#") ||
    path.includes("://")
  ) {
    throw new Error(`Replay path is outside the same-origin v1 root: ${path}`);
  }
}

async function fetchReplayBytes(
  path: string,
  fetcher: ReplayFetch,
): Promise<Uint8Array> {
  assertReplayPath(path);
  const response = await fetcher(path);
  if (!response.ok) {
    throw new Error(`Replay fetch failed for ${path} with ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function parseJsonBytes(bytes: Uint8Array, label: string): unknown {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error(`${label} is not valid UTF-8`, { cause: error });
  }

  try {
    return JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
}

export async function verifyBundleBytes(
  bytes: Uint8Array,
  entry: ReplayManifestEntry,
): Promise<BundleByteVerification> {
  if (bytes.byteLength !== entry.byte_length) {
    return { ok: false, reason: "byte_length_mismatch" };
  }
  if ((await sha256Hex(bytes)) !== entry.sha256) {
    return { ok: false, reason: "sha256_mismatch" };
  }
  return { ok: true };
}

export async function loadReplayManifest(
  fetcher: ReplayFetch = globalThis.fetch,
): Promise<ReplayManifest> {
  const bytes = await fetchReplayBytes(REPLAY_MANIFEST_PATH, fetcher);
  const value = parseJsonBytes(bytes, "Replay manifest");
  assertReplayManifest(value);
  return value;
}

export async function loadReplayBundle(
  entry: ReplayManifestEntry,
  fetcher: ReplayFetch = globalThis.fetch,
): Promise<RunBundle> {
  const bytes = await fetchReplayBytes(entry.path, fetcher);
  const verification = await verifyBundleBytes(bytes, entry);
  if (!verification.ok) {
    throw new Error(
      `Replay bundle failed ${verification.reason.replaceAll("_", " ")}`,
    );
  }

  const value = parseJsonBytes(bytes, "Replay bundle");
  assertRunBundle(value);
  return value;
}
