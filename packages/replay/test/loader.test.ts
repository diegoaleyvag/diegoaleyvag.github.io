import type { ReplayManifestEntry } from "@portfolio/contracts";
import { describe, expect, it } from "vitest";

import { sha256Hex, verifyBundleBytes } from "../src/index.ts";

const bytes = new TextEncoder().encode('{"synthetic":true}\n');

async function matchingEntry(): Promise<ReplayManifestEntry> {
  return {
    scenario_id: "synthetic-maintenance-v1",
    scenario_version: "1.0.0",
    variant: "read-allowed",
    path: "/replays/v1/synthetic-maintenance-v1/read-allowed.json",
    schema_version: "1.0.0",
    byte_length: bytes.byteLength,
    sha256: await sha256Hex(bytes),
  };
}

describe("manifest byte verification", () => {
  it("accepts the exact recorded bytes", async () => {
    await expect(
      verifyBundleBytes(bytes, await matchingEntry()),
    ).resolves.toEqual({ ok: true });
  });

  it("fails closed on byte-length mismatch before parsing", async () => {
    const entry = await matchingEntry();
    await expect(
      verifyBundleBytes(bytes, {
        ...entry,
        byte_length: entry.byte_length + 1,
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "byte_length_mismatch",
    });
  });

  it("fails closed on digest mismatch before parsing", async () => {
    const entry = await matchingEntry();
    await expect(
      verifyBundleBytes(bytes, { ...entry, sha256: "0".repeat(64) }),
    ).resolves.toEqual({
      ok: false,
      reason: "sha256_mismatch",
    });
  });
});
