export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

interface RateLimitRecord {
  minuteWindowStartMs: number;
  minuteCount: number;
  dayWindowStartMs: number;
  dayCount: number;
}

/**
 * Narrow enough to be swapped for a real store (Vercel KV, Upstash, an edge
 * key-value binding) later without touching `respond.ts` — this session
 * only ships the in-memory default.
 */
export interface RateLimiterStore {
  get(key: string): RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): void;
}

function createInMemoryStore(): RateLimiterStore {
  const records = new Map<string, RateLimitRecord>();
  return {
    get: (key) => records.get(key),
    set: (key, record) => {
      records.set(key, record);
    },
  };
}

export interface RateLimiterConfig {
  readonly maxPerMinute: number;
  readonly maxPerDay: number;
  readonly now: () => number;
  readonly store: RateLimiterStore;
}

export interface RateLimiter {
  check(key: string): RateLimitDecision;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const DEFAULT_MAX_PER_MINUTE = 5;
export const DEFAULT_MAX_PER_DAY = 20;

/**
 * A small fixed-window limiter, keyed by an opaque per-session identifier
 * (never an IP — see `apps/site/src/lib/ask-diego/session.ts`). Injectable
 * clock and store make it fully deterministic in tests
 * (`.cursor/rules/testing.mdc`).
 *
 * Known, honestly-stated limitation: the default store is a plain
 * in-memory `Map` scoped to one function instance. On Vercel's Node.js
 * serverless runtime, a cold start gets a fresh, empty map, and concurrent
 * warm instances each keep their own counters — so the "~5/minute,
 * ~20/day" limits above are real per-instance caps, not one global ceiling
 * across every instance serving `/api/ask`. A platform-level mechanism
 * (e.g. Vercel's Firewall rate-limiting) can be layered in front of this
 * endpoint later for a true global cap without changing this module's
 * interface — configuring that firewall rule is explicitly out of scope
 * for this session.
 */
export function createInMemoryRateLimiter(
  overrides: Partial<RateLimiterConfig> = {},
): RateLimiter {
  const config: RateLimiterConfig = {
    maxPerMinute: overrides.maxPerMinute ?? DEFAULT_MAX_PER_MINUTE,
    maxPerDay: overrides.maxPerDay ?? DEFAULT_MAX_PER_DAY,
    now: overrides.now ?? Date.now,
    store: overrides.store ?? createInMemoryStore(),
  };

  return {
    check(key: string): RateLimitDecision {
      const nowMs = config.now();
      const existing = config.store.get(key);

      const minuteWindowStartMs =
        existing !== undefined &&
        nowMs - existing.minuteWindowStartMs < MINUTE_MS
          ? existing.minuteWindowStartMs
          : nowMs;
      const dayWindowStartMs =
        existing !== undefined && nowMs - existing.dayWindowStartMs < DAY_MS
          ? existing.dayWindowStartMs
          : nowMs;

      const minuteCount =
        minuteWindowStartMs === existing?.minuteWindowStartMs
          ? existing.minuteCount
          : 0;
      const dayCount =
        dayWindowStartMs === existing?.dayWindowStartMs ? existing.dayCount : 0;

      if (minuteCount >= config.maxPerMinute) {
        const retryAfterSeconds = Math.ceil(
          (minuteWindowStartMs + MINUTE_MS - nowMs) / 1000,
        );
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, retryAfterSeconds),
        };
      }
      if (dayCount >= config.maxPerDay) {
        const retryAfterSeconds = Math.ceil(
          (dayWindowStartMs + DAY_MS - nowMs) / 1000,
        );
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, retryAfterSeconds),
        };
      }

      config.store.set(key, {
        minuteWindowStartMs,
        minuteCount: minuteCount + 1,
        dayWindowStartMs,
        dayCount: dayCount + 1,
      });
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
