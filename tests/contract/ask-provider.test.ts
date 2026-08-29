import { describe, expect, it, vi } from "vitest";

import {
  createAiGatewayTransport,
  createProviderFromEnv,
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

function gatewayCompletion(content: string): unknown {
  return { choices: [{ message: { content } }] };
}

describe("createAiGatewayTransport (fake transport only — no real network call)", () => {
  it("returns an answer with citation ids on a well-formed response", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
      jsonResponse(
        200,
        gatewayCompletion(
          JSON.stringify({
            answer: "Prism is about model evaluation.",
            citations: ["work/prism"],
          }),
        ),
      ),
    );
    const transport = createAiGatewayTransport(
      {
        model: "test/model",
        apiKey: "sk-test",
        baseUrl: "https://example.invalid/v1",
      },
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
    expect(url).toBe("https://example.invalid/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["authorization"]).toBe(
      "Bearer sk-test",
    );
    const sentBody = JSON.parse(init.body as string) as { model: string };
    expect(sentBody.model).toBe("test/model");
  });

  it.each([402, 429, 503])(
    "degrades to upstream_error on a %s response, never throwing",
    async (status) => {
      const fakeFetch = vi
        .fn()
        .mockResolvedValue(jsonResponse(status, { error: "nope" }));
      const transport = createAiGatewayTransport(
        {
          model: "test/model",
          apiKey: "sk-test",
          baseUrl: "https://example.invalid/v1",
        },
        fakeFetch as unknown as typeof fetch,
      );

      const result = await transport.call(baseInput);
      expect(result).toEqual({ ok: false, reason: "upstream_error" });
    },
  );

  it("degrades to upstream_error on a network failure", async () => {
    const fakeFetch = vi.fn().mockRejectedValue(new Error("network down"));
    const transport = createAiGatewayTransport(
      {
        model: "test/model",
        apiKey: "sk-test",
        baseUrl: "https://example.invalid/v1",
      },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "upstream_error" });
  });

  it("degrades to upstream_error on a timeout (abort)", async () => {
    const fakeFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const transport = createAiGatewayTransport(
      {
        model: "test/model",
        apiKey: "sk-test",
        baseUrl: "https://example.invalid/v1",
        timeoutMs: 5,
      },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "upstream_error" });
  });

  it("degrades to invalid_response when the model content isn't JSON", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, gatewayCompletion("not json at all")),
      );
    const transport = createAiGatewayTransport(
      {
        model: "test/model",
        apiKey: "sk-test",
        baseUrl: "https://example.invalid/v1",
      },
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
          gatewayCompletion(JSON.stringify({ answer: 42, citations: "no" })),
        ),
      );
    const transport = createAiGatewayTransport(
      {
        model: "test/model",
        apiKey: "sk-test",
        baseUrl: "https://example.invalid/v1",
      },
      fakeFetch as unknown as typeof fetch,
    );

    const result = await transport.call(baseInput);
    expect(result).toEqual({ ok: false, reason: "invalid_response" });
  });
});

describe("createProviderFromEnv (the single composition root)", () => {
  it("is disabled (null) when no env vars are set", () => {
    expect(createProviderFromEnv({})).toBeNull();
  });

  it("is disabled when only the model is set", () => {
    expect(
      createProviderFromEnv({ AI_GUIDE_MODEL: "anthropic/claude" }),
    ).toBeNull();
  });

  it("is disabled when only the API key is set", () => {
    expect(createProviderFromEnv({ AI_GUIDE_API_KEY: "sk-test" })).toBeNull();
  });

  it("is enabled once both the model and API key are set", () => {
    const provider = createProviderFromEnv({
      AI_GUIDE_MODEL: "anthropic/claude",
      AI_GUIDE_API_KEY: "sk-test",
    });
    expect(provider).not.toBeNull();
  });
});
