import { describe, expect, it } from "vitest";

import { POST } from "../../apps/site/src/pages/api/ask.ts";

// Derived structurally from `POST`'s own parameter type rather than a
// direct `import type { APIContext } from "astro"` — "astro" resolves fine
// from within `apps/site` (a real dependency there), but not from this
// root-level test file under pnpm's strict per-package `node_modules`.
type PostContext = Parameters<typeof POST>[0];

function postRequest(
  body: unknown,
  init: { readonly contentType?: string | null } = {},
): Request {
  const headers = new Headers();
  if (init.contentType !== null) {
    headers.set("content-type", init.contentType ?? "application/json");
  }
  return new Request("https://example.invalid/api/ask", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function context(request: Request): PostContext {
  return { request } as unknown as PostContext;
}

// This suite runs against the real, deployed-shape module with no
// AI_GUIDE_MODEL/AI_GUIDE_API_KEY set (`.cursor/rules/testing.mdc`: normal
// tests never call a live model provider) — it only exercises the
// Astro-level HTTP plumbing (content-type/body-size handling, status
// codes, JSON shape). `tests/contract/ask-respond.test.ts` covers the
// corpus/provider/rate-limit logic itself with injected fakes.
describe("POST /api/ask (Astro route, no provider configured in this environment)", () => {
  it("answers a confident, real question with a real citation", async () => {
    const response = await POST(
      context(postRequest({ question: "What is Prism?", locale: "en" })),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = (await response.json()) as {
      status: string;
      citations: unknown[];
    };
    expect(body.status).toBe("answered");
    expect(body.citations.length).toBeGreaterThan(0);
  });

  it("rejects a non-JSON content type with a clean 400", async () => {
    const response = await POST(
      context(
        postRequest(
          { question: "What is Prism?", locale: "en" },
          { contentType: "text/plain" },
        ),
      ),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("error");
  });

  it("rejects an oversized body with a clean 400, not a crash", async () => {
    const response = await POST(
      context(postRequest({ question: "x".repeat(50_000), locale: "en" })),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { status: string; message: string };
    expect(body.status).toBe("error");
    expect(body.message).not.toMatch(/at .*\.ts:\d+/);
  });

  it("rejects malformed JSON with a clean 400", async () => {
    const request = new Request("https://example.invalid/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not valid json",
    });

    const response = await POST(context(request));
    expect(response.status).toBe(400);
  });

  it("never leaks a secret-shaped value in a response body", async () => {
    const response = await POST(
      context(postRequest({ question: "What is Prism?", locale: "en" })),
    );
    const text = await response.text();

    expect(text).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
    expect(text.toLowerCase()).not.toContain("authorization");
  });
});
