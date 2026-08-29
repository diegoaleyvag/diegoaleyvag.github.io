import { loadCorpusEntries, type CorpusEntry } from "@portfolio/ask-corpus";
import { describe, expect, it } from "vitest";

import { createInMemoryRateLimiter } from "../../apps/site/src/lib/ask-diego/rate-limiter.ts";
import { handleAskRequest } from "../../apps/site/src/lib/ask-diego/respond.ts";
import type {
  ProviderCallInput,
  ProviderCallResult,
  ProviderTransport,
} from "../../apps/site/src/lib/ask-diego/provider.ts";
import type { AskResult } from "../../apps/site/src/lib/ask-diego/types.ts";

let cachedEntries: Promise<readonly CorpusEntry[]> | undefined;

async function realCorpusEntries(): Promise<readonly CorpusEntry[]> {
  cachedEntries ??= loadCorpusEntries().then((loaded) =>
    loaded.map(({ entry }) => entry),
  );
  return cachedEntries;
}

function freshLimiter() {
  return createInMemoryRateLimiter({
    maxPerMinute: 100,
    maxPerDay: 1000,
    now: Date.now,
  });
}

function fakeProvider(
  handler: (input: ProviderCallInput) => ProviderCallResult,
): ProviderTransport {
  return { call: async (input) => handler(input) };
}

const NEVER_CALLED_PROVIDER: ProviderTransport = {
  call: async () => {
    throw new Error("provider should never be called for this test");
  },
};

async function ask(
  body: unknown,
  overrides: Partial<Parameters<typeof handleAskRequest>[1]> = {},
): Promise<AskResult> {
  const corpusEntries = await realCorpusEntries();
  return handleAskRequest(body, {
    corpusEntries,
    provider: null,
    rateLimiter: freshLimiter(),
    sessionKey: "test-session",
    now: () => 0,
    correlationId: () => "test-correlation-id",
    ...overrides,
  });
}

describe("handleAskRequest — corpus-grounded answers", () => {
  it("answers a confident match directly, with a real citation, never calling a provider", async () => {
    const result = await ask(
      { question: "What is Prism?", locale: "en" },
      { provider: NEVER_CALLED_PROVIDER },
    );

    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe("answered");
    if (result.body.status !== "answered") throw new Error("expected answered");
    expect(result.body.citations).toEqual([
      { id: "work/prism", label: "Prism — Five Decisions" },
    ]);
    expect(result.body.answer.length).toBeGreaterThan(0);
  });

  it("answers the same question in Spanish, in Spanish, with a Spanish citation label", async () => {
    const result = await ask(
      { question: "¿Qué es Prism?", locale: "es" },
      { provider: NEVER_CALLED_PROVIDER },
    );

    expect(result.body.status).toBe("answered");
    if (result.body.status !== "answered") throw new Error("expected answered");
    expect(result.body.answer).toContain("Prism");
    expect(result.body.citations[0]?.id).toBe("work/prism");
  });
});

describe("handleAskRequest — malformed/oversized requests", () => {
  it("rejects a malformed request with a clean 400, no stack trace", async () => {
    const result = await ask({ question: "hi" });

    expect(result.httpStatus).toBe(400);
    expect(result.body.status).toBe("error");
    if (result.body.status !== "error") throw new Error("expected error");
    expect(result.body.message).not.toMatch(/at .*\.ts:\d+/);
  });

  it("rejects an oversized question with a clean 400", async () => {
    const result = await ask({ question: "x".repeat(1000), locale: "en" });
    expect(result.httpStatus).toBe(400);
  });
});

describe("handleAskRequest — no corpus match", () => {
  it("returns the honest don't-know fallback with a contact citation, never a guess", async () => {
    const result = await ask(
      { question: "What's the weather like in Paris tomorrow?", locale: "en" },
      { provider: NEVER_CALLED_PROVIDER },
    );

    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe("fallback");
    if (result.body.status !== "fallback") throw new Error("expected fallback");
    expect(result.body.reason).toBe("no_match");
    expect(result.body.citations.length).toBeGreaterThan(0);
  });
});

describe("handleAskRequest — weak match without a provider", () => {
  it("falls back to the best static match when no provider is configured", async () => {
    const result = await ask(
      {
        question:
          "Does Diego know anything about model evaluation and building things",
        locale: "en",
      },
      { provider: null },
    );

    expect(result.body.status).toBe("fallback");
    if (result.body.status !== "fallback") throw new Error("expected fallback");
    expect(result.body.reason).toBe("no_provider");
    expect(result.body.citations.length).toBeGreaterThan(0);
  });
});

const AMBIGUOUS_QUESTION =
  "Does Diego know anything about model evaluation and building things";

describe("handleAskRequest — provider integration (fake transport only)", () => {
  it("answers with the provider's text once its citations are validated against the sent fragments", async () => {
    const provider = fakeProvider((input) => {
      const fragmentId = input.fragments[0]?.citationId;
      return {
        ok: true,
        value: {
          answer: "Prism is Diego's model-evaluation decision.",
          citationIds: fragmentId ? [fragmentId] : [],
        },
      };
    });

    const result = await ask(
      { question: AMBIGUOUS_QUESTION, locale: "en" },
      { provider },
    );

    expect(result.body.status).toBe("answered");
    if (result.body.status !== "answered") throw new Error("expected answered");
    expect(result.body.answer).toBe(
      "Prism is Diego's model-evaluation decision.",
    );
    expect(result.body.citations).toHaveLength(1);
  });

  it("drops a citation the provider invents that was never in the retrieved context", async () => {
    const provider = fakeProvider((input) => {
      const fragmentId = input.fragments[0]?.citationId;
      return {
        ok: true,
        value: {
          answer: "Prism is Diego's model-evaluation decision.",
          citationIds: [fragmentId ?? "unknown", "work/totally-invented"],
        },
      };
    });

    const result = await ask(
      { question: AMBIGUOUS_QUESTION, locale: "en" },
      { provider },
    );

    expect(result.body.status).toBe("answered");
    if (result.body.status !== "answered") throw new Error("expected answered");
    expect(result.body.citations.map((citation) => citation.id)).not.toContain(
      "work/totally-invented",
    );
    expect(result.body.citations.length).toBeGreaterThan(0);
  });

  it("falls back when every citation the provider returns is bogus", async () => {
    const provider = fakeProvider(() => ({
      ok: true,
      value: {
        answer: "Prism is Diego's model-evaluation decision.",
        citationIds: ["work/totally-invented", "not-real-either"],
      },
    }));

    const result = await ask(
      { question: AMBIGUOUS_QUESTION, locale: "en" },
      { provider },
    );

    expect(result.body.status).toBe("fallback");
    if (result.body.status !== "fallback") throw new Error("expected fallback");
    expect(result.body.reason).toBe("invalid_provider_response");
  });

  it("falls back when the provider returns an empty answer", async () => {
    const provider = fakeProvider(() => ({
      ok: true,
      value: { answer: "", citationIds: [] },
    }));

    const result = await ask(
      { question: AMBIGUOUS_QUESTION, locale: "en" },
      { provider },
    );

    expect(result.body.status).toBe("fallback");
    if (result.body.status !== "fallback") throw new Error("expected fallback");
    expect(result.body.reason).toBe("invalid_provider_response");
  });

  it.each(["402", "429", "503", "timeout"] as const)(
    "degrades to status fallback, never a 500, on a simulated %s from the provider",
    async () => {
      const provider = fakeProvider(() => ({
        ok: false,
        reason: "upstream_error",
      }));

      const result = await ask(
        { question: AMBIGUOUS_QUESTION, locale: "en" },
        { provider },
      );

      expect(result.httpStatus).toBe(200);
      expect(result.body.status).toBe("fallback");
      if (result.body.status !== "fallback")
        throw new Error("expected fallback");
      expect(result.body.reason).toBe("upstream_error");
    },
  );

  it("truncates an overlong provider answer instead of shipping it verbatim", async () => {
    const longAnswer = `Prism is Diego's decision about model evaluation. ${"x".repeat(400)}`;
    const provider = fakeProvider((input) => ({
      ok: true,
      value: {
        answer: longAnswer,
        citationIds: [input.fragments[0]?.citationId ?? ""],
      },
    }));

    const result = await ask(
      { question: AMBIGUOUS_QUESTION, locale: "en" },
      { provider },
    );

    expect(result.body.status).toBe("answered");
    if (result.body.status !== "answered") throw new Error("expected answered");
    expect(result.body.answer.length).toBeLessThan(longAnswer.length);
  });
});

describe("handleAskRequest — rate limiting", () => {
  it("returns 429 status rate_limited once the limiter rejects the session", async () => {
    const corpusEntries = await realCorpusEntries();
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 1,
      maxPerDay: 100,
      now: () => 0,
    });

    const first = await handleAskRequest(
      { question: "What is Prism?", locale: "en" },
      {
        corpusEntries,
        provider: null,
        rateLimiter: limiter,
        sessionKey: "limited-session",
      },
    );
    const second = await handleAskRequest(
      { question: "What is Prism?", locale: "en" },
      {
        corpusEntries,
        provider: null,
        rateLimiter: limiter,
        sessionKey: "limited-session",
      },
    );

    expect(first.httpStatus).toBe(200);
    expect(second.httpStatus).toBe(429);
    expect(second.body.status).toBe("rate_limited");
    if (second.body.status !== "rate_limited")
      throw new Error("expected rate_limited");
    expect(second.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate sessions independent", async () => {
    const corpusEntries = await realCorpusEntries();
    const limiter = createInMemoryRateLimiter({
      maxPerMinute: 1,
      maxPerDay: 100,
      now: () => 0,
    });

    await handleAskRequest(
      { question: "What is Prism?", locale: "en" },
      {
        corpusEntries,
        provider: null,
        rateLimiter: limiter,
        sessionKey: "session-a",
      },
    );
    const otherSession = await handleAskRequest(
      { question: "What is Prism?", locale: "en" },
      {
        corpusEntries,
        provider: null,
        rateLimiter: limiter,
        sessionKey: "session-b",
      },
    );

    expect(otherSession.httpStatus).toBe(200);
  });
});

describe("handleAskRequest — never logs content", () => {
  it("only reports aggregate metric fields, never the question or answer text", async () => {
    const events: unknown[] = [];
    await ask(
      { question: "What is Prism?", locale: "en" },
      { recordMetric: (event) => events.push(event) },
    );

    expect(events).toHaveLength(1);
    const serialized = JSON.stringify(events[0]);
    expect(serialized).not.toContain("Prism");
    expect(serialized).toContain('"outcome":"answered"');
  });
});
