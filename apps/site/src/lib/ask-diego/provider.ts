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
 * transport, its base URL, or its credential (AGENTS.md: "provider
 * selection happens once at a single server-side composition root; the
 * endpoint code never branches on which provider is configured"). Tests
 * inject a fake implementation; no normal test suite run ever constructs a
 * real one.
 */
export interface ProviderTransport {
  readonly call: (input: ProviderCallInput) => Promise<ProviderCallResult>;
}

export interface ProviderConfig {
  readonly model: string;
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_OUTPUT_TOKENS = 220;

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

interface GatewayChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

function buildMessages(
  input: ProviderCallInput,
): readonly GatewayChatMessage[] {
  const systemMessage: GatewayChatMessage = {
    role: "system",
    content: buildSystemPrompt(input.locale, input.fragments),
  };
  const historyMessages: GatewayChatMessage[] = input.history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
  const questionMessage: GatewayChatMessage = {
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
 * A plain-`fetch` OpenAI-Chat-Completions-compatible transport (e.g. Vercel
 * AI Gateway's REST surface, `https://ai-gateway.vercel.sh/v1`) — chosen
 * deliberately over an SDK dependency per the product brief. Every failure
 * mode (non-OK status, network error, timeout, malformed JSON, wrong
 * shape) resolves to a typed `ProviderCallResult`, never a thrown error and
 * never a raw upstream body reaching the caller
 * (`.cursor/rules/security.mdc`).
 */
export function createAiGatewayTransport(
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
          `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
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
              max_tokens: MAX_OUTPUT_TOKENS,
              stream: false,
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
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

export const DEFAULT_AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

/**
 * The single server-side composition root for provider selection
 * (AGENTS.md). Reads exactly three env vars, all optional and undocumented
 * beyond `.env.example`'s placeholders; returns `null` (disabled) unless
 * both the model and API key are set, so "off by default" is the literal
 * absence of configuration, not a feature flag to remember to disable.
 * Every other module only ever sees the resulting `ProviderTransport |
 * null` — never these env var names.
 */
export function createProviderFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): ProviderTransport | null {
  const model = env["AI_GUIDE_MODEL"];
  const apiKey = env["AI_GUIDE_API_KEY"];
  if (
    model === undefined ||
    model === "" ||
    apiKey === undefined ||
    apiKey === ""
  ) {
    return null;
  }
  const baseUrl = env["AI_GUIDE_BASE_URL"] || DEFAULT_AI_GATEWAY_BASE_URL;
  return createAiGatewayTransport({ model, apiKey, baseUrl });
}
