import type { APIRoute } from "astro";

import { CORPUS_ENTRIES } from "@portfolio/ask-corpus";

import {
  createInMemoryRateLimiter,
  createProviderFromEnv,
  extractSessionKey,
  handleAskRequest,
  readBoundedJsonBody,
  type AskMetricEvent,
} from "../../lib/ask-diego/index.ts";

// This is the site's one intentionally dynamic route (AGENTS.md, ADR 0014).
// Every real decision — corpus retrieval, the request/response contract,
// the rate limiter, and the provider seam — lives in
// `apps/site/src/lib/ask-diego/**`, unit- and contract-tested on its own;
// this file is deliberately thin: parse the request, wire the module-scope
// singletons below, and translate the result to an HTTP `Response`.
export const prerender = false;

// The composition root (AGENTS.md: "provider selection happens once at a
// single server-side composition root"). Evaluated once when this function
// instance cold-starts, not per request. `CORPUS_ENTRIES` is a statically
// imported JSON snapshot (see `packages/ask-corpus/src/bundle.ts`) — this
// module never touches the filesystem at request time.
const provider = createProviderFromEnv(process.env);
const rateLimiter = createInMemoryRateLimiter();

/**
 * Aggregate-only, allowlisted-field logging (AGENTS.md: "never logs a full
 * prompt or response"). `AskMetricEvent` structurally cannot carry question
 * or answer text, so there is nothing here to redact.
 */
function recordAggregateMetric(event: AskMetricEvent): void {
  console.log(JSON.stringify({ scope: "ask-diego", ...event }));
}

function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

function randomCorrelationId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
}

export const POST: APIRoute = async ({ request }) => {
  const bodyResult = await readBoundedJsonBody(request);
  if (!bodyResult.ok) {
    return jsonResponse(400, {
      status: "error",
      message: bodyResult.error,
      correlationId: randomCorrelationId(),
    });
  }

  const sessionKey = extractSessionKey(request);

  const result = await handleAskRequest(bodyResult.value, {
    corpusEntries: CORPUS_ENTRIES,
    provider,
    rateLimiter,
    sessionKey,
    recordMetric: recordAggregateMetric,
    correlationId: randomCorrelationId,
  });

  const extraHeaders =
    result.retryAfterSeconds !== undefined
      ? { "retry-after": String(result.retryAfterSeconds) }
      : undefined;
  return jsonResponse(result.httpStatus, result.body, extraHeaders);
};
