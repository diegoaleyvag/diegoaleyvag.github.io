import { describe, expect, it } from "vitest";

import { createInMemoryRateLimiter } from "../../apps/site/src/lib/ask-diego/rate-limiter.ts";

function fakeClock(startMs: number): {
  now: () => number;
  advance: (ms: number) => void;
} {
  let current = startMs;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("createInMemoryRateLimiter", () => {
  it("allows requests under the per-minute limit", () => {
    const clock = fakeClock(0);
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 3,
      maxPerDay: 100,
      now: clock.now,
    });

    expect(limiter.check("session-a").allowed).toBe(true);
    expect(limiter.check("session-a").allowed).toBe(true);
    expect(limiter.check("session-a").allowed).toBe(true);
  });

  it("blocks the request that exceeds the per-minute limit, with a positive retry-after", () => {
    const clock = fakeClock(0);
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 2,
      maxPerDay: 100,
      now: clock.now,
    });

    limiter.check("session-a");
    limiter.check("session-a");
    const decision = limiter.check("session-a");

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the per-minute window once it elapses", () => {
    const clock = fakeClock(0);
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 1,
      maxPerDay: 100,
      now: clock.now,
    });

    expect(limiter.check("session-a").allowed).toBe(true);
    expect(limiter.check("session-a").allowed).toBe(false);

    clock.advance(60_001);
    expect(limiter.check("session-a").allowed).toBe(true);
  });

  it("enforces an independent per-day ceiling even across many one-minute windows", () => {
    const clock = fakeClock(0);
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 100,
      maxPerDay: 3,
      now: clock.now,
    });

    for (let index = 0; index < 3; index += 1) {
      expect(limiter.check("session-a").allowed).toBe(true);
      clock.advance(61_000);
    }
    expect(limiter.check("session-a").allowed).toBe(false);
  });

  it("resets the per-day window once it elapses", () => {
    const clock = fakeClock(0);
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 100,
      maxPerDay: 1,
      now: clock.now,
    });

    expect(limiter.check("session-a").allowed).toBe(true);
    expect(limiter.check("session-a").allowed).toBe(false);

    clock.advance(24 * 60 * 60 * 1000 + 1);
    expect(limiter.check("session-a").allowed).toBe(true);
  });

  it("tracks each session key independently", () => {
    const clock = fakeClock(0);
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 1,
      maxPerDay: 100,
      now: clock.now,
    });

    expect(limiter.check("session-a").allowed).toBe(true);
    expect(limiter.check("session-b").allowed).toBe(true);
    expect(limiter.check("session-a").allowed).toBe(false);
  });

  it("uses real defaults (~5/minute, ~20/day) when no overrides are given", () => {
    const limiter = createInMemoryRateLimiter();
    let allowedCount = 0;
    for (let index = 0; index < 5; index += 1) {
      if (limiter.check("session-defaults").allowed) {
        allowedCount += 1;
      }
    }
    expect(allowedCount).toBe(5);
    expect(limiter.check("session-defaults").allowed).toBe(false);
  });
});
