import type { AskHistoryTurn, AskLocale } from "./types.ts";

export interface ProviderFragment {
  readonly citationId: string;
  readonly text: string;
}

export interface ProviderCallInput {
  readonly question: string;
  readonly locale: AskLocale;
  readonly history: readonly AskHistoryTurn[];
  readonly fragments: readonly ProviderFragment[];
}

export interface ProviderAnswer {
  readonly answer: string;
  readonly citationIds: readonly string[];
}

export type ProviderCallResult =
  | { readonly ok: true; readonly value: ProviderAnswer }
  | {
      readonly ok: false;
      readonly reason: "upstream_error" | "invalid_response";
    };

/**
 * The one seam the composition root (`createProviderFromEnv`) fills in —
 * `respond.ts` only ever sees this narrow interface, never the concrete
 * transport or its credential (AGENTS.md: "provider selection happens once
 * at a single server-side composition root; the endpoint code never
 * branches on which provider is configured"). Tests inject a fake
 * implementation; no normal test suite run ever constructs a real one.
 */
export interface ProviderTransport {
  readonly call: (input: ProviderCallInput) => Promise<ProviderCallResult>;
}

/**
 * No `baseUrl` field on purpose (C9A): an attacker- or misconfiguration-
 * controlled base URL is exactly how a bearer credential gets exfiltrated
 * to an arbitrary host. `GROQ_API_BASE_URL` below is the only endpoint this
 * transport ever calls.
 */
export interface ProviderConfig {
  readonly model: string;
  readonly apiKey: string;
  readonly timeoutMs?: number;
}

/**
 * Groq's official OpenAI-Chat-Completions-compatible base URL, per
 * `https://console.groq.com/docs/openai` (consulted 2026-09-04). Not
 * reachable through any env var — fixed here so a misconfigured or
 * malicious `*_BASE_URL` can never redirect the bearer credential
 * elsewhere (requirement C9A #5).
 */
export const GROQ_API_BASE_URL = "https://api.groq.com/openai/v1";

// Tight timeout, zero retries (C9A #6): Groq's inference is LPU-fast, so a
// generous OpenAI-style multi-second budget isn't needed.
const DEFAULT_TIMEOUT_MS = 4_000;

/**
 * A *generation budget*, not the visible answer length (C9A follow-up,
 * 2026-09-05): a real Preview request against `openai/gpt-oss-20b` hit the
 * previous, tighter 160-token budget exactly and left the JSON object
 * truncated mid-string — syntactically invalid, so `parseProviderAnswer`
 * correctly rejected it, but the request itself was otherwise healthy
 * (200, well-formed 352-input-token prompt). 512 leaves enough headroom
 * for the model to always finish a complete `{"answer":...,"citations":
 * [...]}` object. The user-visible length limit is enforced separately —
 * the prompt's own character rule below and `truncateAnswer` in
 * `response.ts` — raising this generation budget does not raise that
 * visible ceiling.
 */
const MAX_COMPLETION_TOKENS = 512;

/**
 * Groq Structured Outputs, strict mode
 * (`https://console.groq.com/docs/structured-outputs`, consulted
 * 2026-09-05): constrains generation at the token level so the response
 * can only ever be `{ answer: string, citations: string[] }` —
 * `strict: true` requires every property `required` and
 * `additionalProperties: false`. `openai/gpt-oss-20b` (the model observed
 * live in Preview) is on Groq's strict-mode-supported list. This is in
 * addition to, not instead of, the existing runtime `parseProviderAnswer`
 * validation below and the later citation whitelist in `respond.ts` — a
 * provider is untrusted input regardless of what it was asked to
 * guarantee.
 */
const PROVIDER_ANSWER_JSON_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    citations: { type: "array", items: { type: "string" } },
  },
  required: ["answer", "citations"],
  additionalProperties: false,
} as const;

function buildSystemPrompt(
  locale: AskLocale,
  fragments: readonly ProviderFragment[],
): string {
  const languageName = locale === "es" ? "Spanish" : "English";
  const fragmentLines = fragments
    .map(
      (fragment, index) =>
        `[${index + 1}] (id: ${fragment.citationId}) ${fragment.text}`,
    )
    .join("\n");

  return [
    'You are "Ask Diego", a strictly limited assistant on a portfolio site.',
    'Answer ONLY using the numbered context fragments below. Never use outside knowledge about "Diego" or anything else, never guess, and never state an opinion on his behalf.',
    'Respond with compact JSON only, matching exactly this shape and nothing else: {"answer": string, "citations": string[]}.',
    `Rules: (1) "answer" must be written in ${languageName} and stay under ${220} characters. (2) "citations" must contain only ids copied from the fragments below that the answer actually relies on. (3) If the fragments do not answer the question, return {"answer": "", "citations": []} — never fall back to general knowledge. (4) Never call a tool or emit anything other than the JSON object.`,
    "",
    "Context fragments:",
    fragmentLines,
  ].join("\n");
}

interface GroqChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

function buildMessages(input: ProviderCallInput): readonly GroqChatMessage[] {
  const systemMessage: GroqChatMessage = {
    role: "system",
    content: buildSystemPrompt(input.locale, input.fragments),
  };
  const historyMessages: GroqChatMessage[] = input.history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
  const questionMessage: GroqChatMessage = {
    role: "user",
    content: input.question,
  };
  return [systemMessage, ...historyMessages, questionMessage];
}

function parseProviderAnswer(rawContent: string): ProviderAnswer | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return undefined;
  }
  const { answer, citations } = parsed as Record<string, unknown>;
  if (typeof answer !== "string") {
    return undefined;
  }
  if (
    !Array.isArray(citations) ||
    !citations.every((citation) => typeof citation === "string")
  ) {
    return undefined;
  }
  return { answer, citationIds: citations };
}

/**
 * A plain-`fetch` call against Groq's official OpenAI-Chat-Completions-
 * compatible REST surface (`GROQ_API_BASE_URL`) — chosen deliberately over
 * an SDK dependency per the product brief (zero new dependencies). Every
 * failure mode (non-OK status — including `401`/`429` — network error,
 * timeout, malformed JSON, wrong shape) resolves to a typed
 * `ProviderCallResult`, never a thrown error and never a raw upstream body
 * reaching the caller (`.cursor/rules/security.mdc`). Exactly one `fetch`
 * call per invocation: no retry, no backoff, ever.
 *
 * Operational kill switch (C9A #8): revoking or disabling the Groq API key
 * (or the whole Groq project) from the Groq console takes effect
 * immediately on Groq's side — the very next call here receives a
 * `401`/`403`, which this function already turns into `upstream_error`, so
 * the endpoint degrades to the corpus/fallback with no Vercel env change
 * and no redeploy required. A Vercel environment variable edit is NOT an
 * instant kill switch (it only takes effect on the next deployment); do
 * not rely on it for an emergency stop.
 */
export function createGroqTransport(
  config: ProviderConfig,
  fetchImplementation: typeof fetch = fetch,
): ProviderTransport {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    async call(input: ProviderCallInput): Promise<ProviderCallResult> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImplementation(
          `${GROQ_API_BASE_URL}/chat/completions`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              messages: buildMessages(input),
              temperature: 0,
              max_completion_tokens: MAX_COMPLETION_TOKENS,
              // gpt-oss reasoning tokens would otherwise eat into the
              // completion budget above and add latency for no visitor-
              // facing benefit on this strictly extractive task.
              include_reasoning: false,
              reasoning_effort: "low",
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "ask_diego_answer",
                  strict: true,
                  schema: PROVIDER_ANSWER_JSON_SCHEMA,
                },
              },
              stream: false,
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          // Covers 401/403 (revoked/invalid key), 404 (unknown/decommissioned
          // model), 429 (rate limit/quota exhausted), and 5xx alike — the
          // caller degrades to the static fallback in every case
          // (AGENTS.md), and the status code itself is never logged or
          // surfaced to the visitor.
          return { ok: false, reason: "upstream_error" };
        }

        const payload = (await response.json()) as {
          readonly choices?: readonly {
            readonly message?: { readonly content?: unknown };
          }[];
        };
        const rawContent = payload.choices?.[0]?.message?.content;
        if (typeof rawContent !== "string") {
          return { ok: false, reason: "invalid_response" };
        }

        const parsed = parseProviderAnswer(rawContent);
        if (parsed === undefined) {
          return { ok: false, reason: "invalid_response" };
        }
        return { ok: true, value: parsed };
      } catch {
        // Network error, abort/timeout, or a non-JSON response body all
        // collapse to the same graceful "upstream_error" — the caller
        // degrades to the static fallback either way (AGENTS.md).
        return { ok: false, reason: "upstream_error" };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

/**
 * Provider activation is gated to Vercel's real, deployed environments —
 * Preview and, since this explicit post-Preview authorization (C9A),
 * Production — never Development or an unset `VERCEL_ENV` (e.g. local).
 * `VERCEL_ENV` is a system variable Vercel itself sets on every deployment
 * (`"production" | "preview" | "development"`), never something this repo
 * defines or a visitor can influence. Checking it here — inside the one
 * composition root — means a `GROQ_API_KEY`/`GROQ_MODEL` pair accidentally
 * also saved against Development in the Vercel dashboard still can't
 * activate the provider there; only an actual Preview or Production
 * deployment can. Locally (no `VERCEL_ENV` at all) the provider is
 * likewise off, matching "off by default" in every test run (AGENTS.md).
 */
const ALLOWED_VERCEL_ENVS: ReadonlySet<string> = new Set([
  "preview",
  "production",
]);

/**
 * The single server-side composition root for provider selection
 * (AGENTS.md). Reads exactly two env vars, both optional and undocumented
 * beyond `.env.example`'s placeholders; returns `null` (disabled) unless
 * the deployment is a real Vercel Preview or Production deployment AND
 * both the model and API key are set, so "off by default" is the literal
 * absence of configuration (or the wrong environment), not a feature flag
 * to remember to disable. Every other module only ever sees the resulting
 * `ProviderTransport | null` — never these env var names.
 *
 * `GROQ_MODEL` has no default value on purpose: Groq's model lineup and
 * per-model quotas are account-specific and change over time
 * (`https://console.groq.com/docs/rate-limits`, consulted 2026-09-04), so
 * hardcoding one here would risk silently pointing at a model the
 * operator's account can't actually serve. The exact value is a manual,
 * account-verified checkpoint, set separately in Vercel's Preview- and
 * Production-scoped environment variables (each environment's copy is its
 * own secret; this function never assumes they're the same value).
 */
export function createProviderFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): ProviderTransport | null {
  const vercelEnv = env["VERCEL_ENV"];
  if (vercelEnv === undefined || !ALLOWED_VERCEL_ENVS.has(vercelEnv)) {
    return null;
  }
  const model = env["GROQ_MODEL"];
  const apiKey = env["GROQ_API_KEY"];
  if (
    model === undefined ||
    model === "" ||
    apiKey === undefined ||
    apiKey === ""
  ) {
    return null;
  }
  return createGroqTransport({ model, apiKey });
}
