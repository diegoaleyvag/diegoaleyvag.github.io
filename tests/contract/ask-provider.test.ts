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
    const sentBody = JSON.parse(init.body as string) as {
      model: string;
      temperature: number;
    };
    expect(sentBody.model).toBe("test/model");
    expect(sentBody.temperature).toBe(0);
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

  it("is disabled on Production even when both vars are configured (accidental misconfiguration)", () => {
    expect(
      createProviderFromEnv({
        VERCEL_ENV: "production",
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

  it("is enabled only once VERCEL_ENV=preview AND both the model and API key are set", () => {
    const provider = createProviderFromEnv({
      ...PREVIEW_ENV,
      GROQ_MODEL: "test/model",
      GROQ_API_KEY: "sk-test",
    });
    expect(provider).not.toBeNull();
  });
});
