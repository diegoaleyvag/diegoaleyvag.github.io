import type { CorpusLocale } from "@portfolio/ask-corpus";

export type AskLocale = CorpusLocale;

export interface AskHistoryTurn {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface AskRequestBody {
  readonly question: string;
  readonly locale: AskLocale;
  readonly history: readonly AskHistoryTurn[];
}

export interface AskCitation {
  readonly id: string;
  readonly label: string;
}

export type AskFallbackReason =
  "no_provider" | "no_match" | "upstream_error" | "invalid_provider_response";

export interface AskAnsweredResponse {
  readonly status: "answered";
  readonly locale: AskLocale;
  readonly answer: string;
  readonly citations: readonly AskCitation[];
}

export interface AskFallbackResponse {
  readonly status: "fallback";
  readonly locale: AskLocale;
  readonly answer: string;
  readonly citations: readonly AskCitation[];
  readonly reason: AskFallbackReason;
}

export interface AskRateLimitedResponse {
  readonly status: "rate_limited";
  readonly locale: AskLocale;
  readonly retryAfterSeconds: number;
}

export interface AskErrorResponse {
  readonly status: "error";
  readonly message: string;
  readonly correlationId: string;
}

export type AskResponseBody =
  | AskAnsweredResponse
  | AskFallbackResponse
  | AskRateLimitedResponse
  | AskErrorResponse;

export interface AskResult {
  readonly httpStatus: number;
  readonly body: AskResponseBody;
  readonly retryAfterSeconds?: number;
}

/**
 * Aggregate-only operational event. Never includes question/answer content
 * (AGENTS.md: "never logs a full prompt or response") — only bounded,
 * allowlisted identifiers, matching `.cursor/rules/ai-guide.mdc`.
 */
export interface AskMetricEvent {
  readonly outcome: "answered" | "fallback" | "rate_limited" | "error";
  readonly locale: AskLocale | null;
  readonly reason?: AskFallbackReason;
  readonly latencyMs: number;
}
