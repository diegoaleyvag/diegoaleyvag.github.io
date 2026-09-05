import { describe, expect, it, vi } from "vitest";

import {
  createGroqTransport,
  createProviderFromEnv,
  GROQ_API_BASE_URL,
} from "../../apps/site/src/lib/ask-diego/provider.ts";
import type { ProviderCallInput } from "../../apps/site/src/lib/ask-diego/provider.ts";

const baseInput: ProviderCallInput = {
  question: "What is Prism?",
  locale: "en",
  history: [],
  fragments: [{ citationId: "work/prism", text: "Prism asks..." }],
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function groqCompletion(content: string): unknown {
  return { choices: [{ message: { content } }] };
}

describe("createGroqTransport (fake transport only — no real network call)", () => {
  it("calls Groq's fixed official OpenAI-compatible endpoint, never a configurable one", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
      jsonResponse(
        200,
        groqCompletion(
          JSON.stringify({
            answer: "Prism is about model evaluation.",
            citations: ["work/prism"],
          }),
        ),
      ),
    );
    const transport = createGroqTransport(
      { model: "test/model", apiKey: "sk-test" },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);

    expect(result).toEqual({
      ok: true,
      value: {
        answer: "Prism is about model evaluation.",
        citationIds: ["work/prism"],
      },
    });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = fakeFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${GROQ_API_BASE_URL}/chat/completions`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["authorization"]).toBe(
      "Bearer sk-test",
    );
    const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sentBody.model).toBe("test/model");
    expect(sentBody.temperature).toBe(0);
  });

  it("sends the exact structured-output/reasoning/token-budget payload, with no deprecated max_tokens field", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          200,
          groqCompletion(
            JSON.stringify({ answer: "Prism.", citations: ["work/prism"] }),
          ),
        ),
      );
    const transport = createGroqTransport(
      { model: "test/model", apiKey: "sk-test" },
      fakeFetch as unknown as typeof fetch,
    );

    await transport.call(baseInput);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [, init] = fakeFetch.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;

    // Deprecated field must be gone — this is exactly what regressed a
    // real Preview request (truncated JSON at the old max_tokens budget).
    expect(sentBody).not.toHaveProperty("max_tokens");
    expect(sentBody.max_completion_tokens).toBe(512);
    expect(sentBody.include_reasoning).toBe(false);
    expect(sentBody.reasoning_effort).toBe("low");
    expect(sentBody.temperature).toBe(0);

    const responseFormat = sentBody.response_format as {
      type: string;
      json_schema: { strict: boolean; schema: Record<string, unknown> };
    };
    expect(responseFormat.type).toBe("json_schema");
    expect(responseFormat.json_schema.strict).toBe(true);
    expect(responseFormat.json_schema.schema).toEqual({
      type: "object",
      properties: {
        answer: { type: "string" },
        citations: { type: "array", items: { type: "string" } },
      },
      required: ["answer", "citations"],
      additionalProperties: false,
    });
  });

  it.each([401, 402, 403, 404, 429, 503])(
    "degrades to upstream_error on a %s response (incl. revoked key / exhausted quota), never throwing",
    async (status) => {
      const fakeFetch = vi
        .fn()
        .mockResolvedValue(jsonResponse(status, { error: "nope" }));
      const transport = createGroqTransport(
        { model: "test/model", apiKey: "sk-test" },
        fakeFetch as unknown as typeof fetch,
      );

      const result = await transport.call(baseInput);
      expect(result).toEqual({ ok: false, reason: "upstream_error" });
      // Exactly one attempt: no implicit retry/backoff on any failure mode.
      expect(fakeFetch).toHaveBeenCalledTimes(1);
    },
  );

  it("degrades to upstream_error on a network failure, with a single attempt", async () => {
    const fakeFetch = vi.fn().mockRejectedValue(new Error("network down"));
    const transport = createGroqTransport(
      { model: "test/model", apiKey: "sk-test" },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "upstream_error" });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it("degrades to upstream_error on a timeout (abort) within the configured budget, with a single attempt", async () => {
    const fakeFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const transport = createGroqTransport(
      { model: "test/model", apiKey: "sk-test", timeoutMs: 5 },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "upstream_error" });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it("degrades to invalid_response when the model content isn't JSON", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, groqCompletion("not json at all")));
    const transport = createGroqTransport(
      { model: "test/model", apiKey: "sk-test" },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "invalid_response" });
  });

  it("degrades to invalid_response when the JSON shape is wrong", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          200,
          groqCompletion(JSON.stringify({ answer: 42, citations: "no" })),
        ),
      );
    const transport = createGroqTransport(
      { model: "test/model", apiKey: "sk-test" },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "invalid_response" });
  });

  it("never leaks the API key into a returned result, even on failure", async () => {
    const apiKey = "sk-super-secret-value";
    const fakeFetch = vi.fn().mockResolvedValue(jsonResponse(500, {}));
    const transport = createGroqTransport(
      { model: "test/model", apiKey },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });
});

const PREVIEW_ENV = { VERCEL_ENV: "preview" } as const;
const PRODUCTION_ENV = { VERCEL_ENV: "production" } as const;

describe("createProviderFromEnv (the single composition root)", () => {
  it("is disabled (null) when no env vars are set at all", () => {
    expect(createProviderFromEnv({})).toBeNull();
  });

  it("is disabled when GROQ_MODEL/GROQ_API_KEY are set but VERCEL_ENV is missing (local/build time)", () => {
    expect(
      createProviderFromEnv({
        GROQ_MODEL: "test/model",
        GROQ_API_KEY: "sk-test",
      }),
    ).toBeNull();
  });

  it("is disabled on a Development deployment even when both vars are configured", () => {
    expect(
      createProviderFromEnv({
        VERCEL_ENV: "development",
        GROQ_MODEL: "test/model",
        GROQ_API_KEY: "sk-test",
      }),
    ).toBeNull();
  });

  it("is disabled on Preview when only the model is set", () => {
    expect(
      createProviderFromEnv({
        ...PREVIEW_ENV,
        GROQ_MODEL: "test/model",
      }),
    ).toBeNull();
  });

  it("is disabled on Preview when only the API key is set", () => {
    expect(
      createProviderFromEnv({ ...PREVIEW_ENV, GROQ_API_KEY: "sk-test" }),
    ).toBeNull();
  });

  it("is enabled once VERCEL_ENV=preview AND both the model and API key are set", () => {
    const provider = createProviderFromEnv({
      ...PREVIEW_ENV,
      GROQ_MODEL: "test/model",
      GROQ_API_KEY: "sk-test",
    });
    expect(provider).not.toBeNull();
  });

  // Production activation was explicitly authorized only after a passing
  // Preview verification (C9A follow-up, 2026-09-05) — same composition
  // root, same two env vars, each scoped independently per Vercel
  // environment.
  it("is enabled once VERCEL_ENV=production AND both the model and API key are set", () => {
    const provider = createProviderFromEnv({
      ...PRODUCTION_ENV,
      GROQ_MODEL: "test/model",
      GROQ_API_KEY: "sk-test",
    });
    expect(provider).not.toBeNull();
  });

  it("is disabled on Production when only the model is set", () => {
    expect(
      createProviderFromEnv({
        ...PRODUCTION_ENV,
        GROQ_MODEL: "test/model",
      }),
    ).toBeNull();
  });

  it("is disabled on Production when only the API key is set", () => {
    expect(
      createProviderFromEnv({ ...PRODUCTION_ENV, GROQ_API_KEY: "sk-test" }),
    ).toBeNull();
  });
});
