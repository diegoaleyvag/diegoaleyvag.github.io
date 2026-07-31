import { describe, expect, it } from "vitest";

import {
  REPLAY_MANIFEST_SCHEMA_VERSION,
  RUN_BUNDLE_SCHEMA_VERSION,
  runBundleSchema,
  validateReplayManifest,
  validateRunBundle,
} from "../src/index.ts";
import { validAllowBundle, validDenyBundle } from "./fixtures.ts";

describe("RunBundle v1 contract", () => {
  it("accepts the allow contract fixture", () => {
    expect(validateRunBundle(validAllowBundle())).toEqual(
      expect.objectContaining({ ok: true }),
    );
  });

  it("accepts the deny contract fixture without tool execution", () => {
    const bundle = validDenyBundle();

    expect(
      bundle.events.some(
        ({ type }) => type === "tool_started" || type === "tool_completed",
      ),
    ).toBe(false);
    expect(validateRunBundle(bundle)).toEqual(
      expect.objectContaining({ ok: true }),
    );
  });

  it("rejects an unknown closed-contract field", () => {
    const invalid: Record<string, unknown> =
      structuredClone(validAllowBundle());
    invalid["unexpected"] = "closed contracts reject this";

    const result = validateRunBundle(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "must NOT have additional properties",
          }),
        ]),
      );
    }
  });

  it("rejects a non-contiguous event sequence", () => {
    const invalid = structuredClone(validAllowBundle());
    const secondEvent = invalid.events[1];
    if (secondEvent === undefined) {
      throw new Error("fixture must contain a second event");
    }
    secondEvent.sequence = 8;

    const result = validateRunBundle(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        instancePath: "/events/1/sequence",
        message: "must equal contiguous sequence 2",
      });
    }
  });

  it("rejects a false synthetic marker", () => {
    const invalid = {
      ...structuredClone(validAllowBundle()),
      synthetic: false,
    };

    expect(validateRunBundle(invalid).ok).toBe(false);
  });

  it("defines every first-slice event variant in schema", () => {
    expect(Object.keys(runBundleSchema.$defs)).toEqual(
      expect.arrayContaining([
        "runStartedEvent",
        "identityAssessedEvent",
        "policyEvaluatedEvent",
        "toolStartedEvent",
        "toolCompletedEvent",
        "runCompletedEvent",
        "runDeniedEvent",
      ]),
    );
  });
});

describe("Replay manifest v1 contract", () => {
  it("accepts a closed digest manifest", () => {
    const manifest = {
      schema_version: REPLAY_MANIFEST_SCHEMA_VERSION,
      synthetic: true,
      generated_at: "2030-01-01T00:00:00.000Z",
      generator_version: "1.0.0",
      entries: [
        {
          scenario_id: "synthetic-maintenance-v1",
          scenario_version: "1.0.0",
          variant: "read-allowed",
          path: "/replays/v1/synthetic-maintenance-v1/read-allowed.json",
          schema_version: RUN_BUNDLE_SCHEMA_VERSION,
          byte_length: 1024,
          sha256: "0".repeat(64),
        },
      ],
    };

    expect(validateReplayManifest(manifest)).toEqual({
      ok: true,
      value: manifest,
    });
  });
});
