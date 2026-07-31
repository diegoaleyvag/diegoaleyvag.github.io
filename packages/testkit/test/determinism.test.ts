import { describe, expect, it } from "vitest";

import {
  FixedLogicalClock,
  deterministicEventId,
  deterministicRunId,
} from "../src/index.ts";

describe("deterministic replay testkit", () => {
  it("advances only by the configured logical step", () => {
    const clock = new FixedLogicalClock();

    expect(clock.atSequence(1)).toBe("2030-01-01T00:00:00.000Z");
    expect(clock.atSequence(3)).toBe("2030-01-01T00:00:02.000Z");
  });

  it("derives stable visibly synthetic identifiers", () => {
    expect(deterministicRunId("synthetic-maintenance-v1", "read-allowed")).toBe(
      "synthetic-run-synthetic-maintenance-v1-read-allowed",
    );
    expect(deterministicEventId("read-allowed", "tool_completed")).toBe(
      "synthetic-event-read-allowed-tool-completed",
    );
  });
});
