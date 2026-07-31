import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { validateRunBundle } from "@portfolio/contracts";
import { describe, expect, it } from "vitest";

import {
  buildReplayArtifacts,
  type GeneratedReplayArtifacts,
} from "../../../tools/build-replays/src/builder.ts";
import { generateReplayDirectory } from "../../../tools/build-replays/src/cli.ts";
import { createOpaPolicyEvaluator } from "../../../tools/build-replays/src/opa-evaluator.ts";
import { sha256Hex, verifyRunBundleEvent } from "../src/index.ts";

let cachedArtifacts: Promise<GeneratedReplayArtifacts> | undefined;

function actualArtifacts(): Promise<GeneratedReplayArtifacts> {
  cachedArtifacts ??= createOpaPolicyEvaluator().then((evaluatePolicy) =>
    buildReplayArtifacts({ evaluatePolicy }),
  );
  return cachedArtifacts;
}

describe("deterministic replay builder", () => {
  it("embeds real OPA allow and deny decisions in schema-valid bundles", async () => {
    const artifacts = await actualArtifacts();

    expect(artifacts.bundles.map(({ scenario }) => scenario.variant)).toEqual([
      "read-allowed",
      "adjust-denied",
    ]);
    expect(
      artifacts.bundles.map(({ policy }) => policy.decision.effect),
    ).toEqual(["allow", "deny"]);
    expect(
      artifacts.bundles.map(({ policy }) => policy.decision.rule_id),
    ).toEqual([
      "capability.fixture_read.allow",
      "capability.fixture_adjust.missing",
    ]);
    for (const bundle of artifacts.bundles) {
      expect(validateRunBundle(bundle)).toEqual(
        expect.objectContaining({ ok: true }),
      );
      expect(bundle.policy.source_sha256).toBe(artifacts.policySourceSha256);
    }
  });

  it("records tool execution only for the allowed variant", async () => {
    const artifacts = await actualArtifacts();
    const allowed = artifacts.bundles.find(
      ({ scenario }) => scenario.variant === "read-allowed",
    );
    const denied = artifacts.bundles.find(
      ({ scenario }) => scenario.variant === "adjust-denied",
    );

    expect(allowed?.events.map(({ type }) => type)).toEqual([
      "run_started",
      "identity_assessed",
      "policy_evaluated",
      "tool_started",
      "tool_completed",
      "run_completed",
    ]);
    expect(
      denied?.events.some(
        ({ type }) => type === "tool_started" || type === "tool_completed",
      ),
    ).toBe(false);
  });

  it("builds a valid inclusion proof for every generated event", async () => {
    const artifacts = await actualArtifacts();

    for (const bundle of artifacts.bundles) {
      for (const event of bundle.events) {
        await expect(
          verifyRunBundleEvent(bundle, event.sequence),
        ).resolves.toBe(true);
      }
    }
  });

  it("records exact bundle byte lengths and SHA-256 digests", async () => {
    const artifacts = await actualArtifacts();

    for (const entry of artifacts.manifest.entries) {
      const relativePath = entry.path.replace("/replays/v1/", "");
      const bytes = artifacts.files.get(relativePath);
      expect(bytes).toBeDefined();
      expect(bytes?.byteLength).toBe(entry.byte_length);
      await expect(sha256Hex(bytes!)).resolves.toBe(entry.sha256);
    }
  });

  it("regenerates byte-for-byte identically", async () => {
    const evaluatePolicy = await createOpaPolicyEvaluator();
    const first = await actualArtifacts();
    const second = await buildReplayArtifacts({ evaluatePolicy });

    expect([...second.files.keys()]).toEqual([...first.files.keys()]);
    for (const [relativePath, bytes] of first.files) {
      expect(second.files.get(relativePath)).toEqual(bytes);
    }
  });

  it.each([
    ["missing", { effect: "deny" }],
    ["malformed", "deny"],
    [
      "unknown",
      {
        effect: "deny",
        rule_id: "capability.input.invalid",
        reason: "Synthetic invalid input.",
        action: "fixture:read",
        required_capability: "fixture:read",
        unknown: true,
      },
    ],
    [
      "schema-invalid",
      {
        effect: "permit",
        rule_id: "capability.fixture_read.allow",
        reason: "Synthetic invalid effect.",
        action: "fixture:read",
        required_capability: "fixture:read",
      },
    ],
  ])("rejects %s policy output before producing bytes", async (_, output) => {
    await expect(
      buildReplayArtifacts({ evaluatePolicy: async () => output }),
    ).rejects.toThrow(/OPA policy decision/);
  });

  it("leaves existing output untouched on malformed policy output", async () => {
    const temporaryRoot = await mkdtemp(
      path.join(tmpdir(), "synthetic-replay-builder-"),
    );
    const outputDirectory = path.join(temporaryRoot, "v1");
    const sentinelPath = path.join(outputDirectory, "sentinel.txt");
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(sentinelPath, "existing synthetic output\n", "utf8");

    try {
      await expect(
        generateReplayDirectory(
          async () => ({
            effect: "allow",
            rule_id: "capability.fixture_read.allow",
            reason:
              "Active agent has the required synthetic fixture capability.",
            action: "fixture:read",
            required_capability: "fixture:read",
            unknown: true,
          }),
          outputDirectory,
        ),
      ).rejects.toThrow(/missing or unknown fields/);

      await expect(access(sentinelPath)).resolves.toBeUndefined();
      await expect(readFile(sentinelPath, "utf8")).resolves.toBe(
        "existing synthetic output\n",
      );
    } finally {
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });
});
