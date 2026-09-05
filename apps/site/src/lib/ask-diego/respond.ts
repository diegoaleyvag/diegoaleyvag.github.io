import {
  CONFIDENT_MATCH_THRESHOLD,
  WEAK_MATCH_THRESHOLD,
  searchCorpus,
  type CorpusEntry,
} from "@portfolio/ask-corpus";

import { parseAskRequestBody } from "./request.ts";
import type { ProviderFragment, ProviderTransport } from "./provider.ts";
import type { RateLimiter } from "./rate-limiter.ts";
import {
  citationFromEntry,
  truncateAnswer,
  validateProviderCitations,
} from "./response.ts";
import type { AskLocale, AskMetricEvent, AskResult } from "./types.ts";

/** Never more than this many retrieved fragments leave the server, even when a provider is configured (ai-guide.mdc). */
const MAX_PROVIDER_FRAGMENTS = 4;

const NO_MATCH_MESSAGE: Record<AskLocale, string> = {
  en: "I don't have verified information about that. You can reach Diego directly instead.",
  es: "No tengo información verificada sobre eso. Puedes contactar a Diego directamente.",
};

const CONTACT_CITATION_ID = "faq-contact";

export interface AskDependencies {
  readonly corpusEntries: readonly CorpusEntry[];
  readonly provider: ProviderTransport | null;
  readonly rateLimiter: RateLimiter;
  readonly sessionKey: string;
  readonly now?: () => number;
  readonly recordMetric?: (event: AskMetricEvent) => void;
  readonly correlationId?: () => string;
}

function defaultCorrelationId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function findContactEntry(
  corpusEntries: readonly CorpusEntry[],
): CorpusEntry | undefined {
  return corpusEntries.find((entry) => entry.id === CONTACT_CITATION_ID);
}

function toProviderFragments(
  matches: readonly { readonly entry: CorpusEntry }[],
  locale: AskLocale,
): readonly ProviderFragment[] {
  return matches.map(({ entry }) => ({
    citationId: entry.citationId,
    text: `${entry[locale].question} ${entry[locale].answer}`,
  }));
}

/**
 * The composition point for one `/api/ask` request: validate, rate-limit,
 * retrieve, and only then decide whether a confident corpus match answers
 * directly, a weak match goes to the optional provider, or nothing
 * qualifies and the honest "don't know" fallback applies. Every branch
 * returns a `200`/`400`/`429` `AskResult` — never a thrown error for an
 * upstream provider failure (AGENTS.md, `.cursor/rules/security.mdc`).
 */
export async function handleAskRequest(
  rawBody: unknown,
  deps: AskDependencies,
): Promise<AskResult> {
  const now = deps.now ?? Date.now;
  const correlationId = deps.correlationId ?? defaultCorrelationId;
  const recordMetric = deps.recordMetric ?? (() => {});
  const startedAtMs = now();

  const parsed = parseAskRequestBody(rawBody);
  if (!parsed.ok) {
    recordMetric({
      outcome: "error",
      locale: null,
      latencyMs: now() - startedAtMs,
    });
    return {
      httpStatus: 400,
      body: {
        status: "error",
        message: parsed.error,
        correlationId: correlationId(),
      },
    };
  }
  const { question, locale, history } = parsed.value;

  const rateLimitDecision = deps.rateLimiter.check(deps.sessionKey);
  if (!rateLimitDecision.allowed) {
    recordMetric({
      outcome: "rate_limited",
      locale,
      latencyMs: now() - startedAtMs,
    });
    return {
      httpStatus: 429,
      body: {
        status: "rate_limited",
        locale,
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
      },
      retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
    };
  }

  try {
    const matches = searchCorpus(deps.corpusEntries, locale, question);
    const top = matches[0];

    if (top !== undefined && top.score >= CONFIDENT_MATCH_THRESHOLD) {
      recordMetric({
        outcome: "answered",
        locale,
        latencyMs: now() - startedAtMs,
      });
      return {
        httpStatus: 200,
        body: {
          status: "answered",
          locale,
          answer: top.entry[locale].answer,
          citations: [citationFromEntry(top.entry, locale)],
        },
      };
    }

    const weakMatches = matches.filter(
      (match) => match.score >= WEAK_MATCH_THRESHOLD,
    );

    if (weakMatches.length === 0) {
      const contactEntry = findContactEntry(deps.corpusEntries);
      recordMetric({
        outcome: "fallback",
        locale,
        reason: "no_match",
        latencyMs: now() - startedAtMs,
      });
      return {
        httpStatus: 200,
        body: {
          status: "fallback",
          locale,
          answer: NO_MATCH_MESSAGE[locale],
          citations:
            contactEntry === undefined
              ? []
              : [citationFromEntry(contactEntry, locale)],
          reason: "no_match",
        },
      };
    }

    const bestWeakMatch = weakMatches[0];
    if (bestWeakMatch === undefined) {
      // Unreachable: weakMatches.length > 0 guarantees index 0 exists.
      throw new Error("Unexpected empty weak-match list");
    }
    const fallbackToBestWeakMatch = (
      reason: "no_provider" | "upstream_error" | "invalid_provider_response",
    ): AskResult => {
      recordMetric({
        outcome: "fallback",
        locale,
        reason,
        latencyMs: now() - startedAtMs,
      });
      return {
        httpStatus: 200,
        body: {
          status: "fallback",
          locale,
          answer: bestWeakMatch.entry[locale].answer,
          citations: [citationFromEntry(bestWeakMatch.entry, locale)],
          reason,
        },
      };
    };

    if (deps.provider === null) {
      return fallbackToBestWeakMatch("no_provider");
    }

    const fragments = toProviderFragments(
      weakMatches.slice(0, MAX_PROVIDER_FRAGMENTS),
      locale,
    );
    const providerResult = await deps.provider.call({
      question,
      locale,
      history,
      fragments,
    });

    if (!providerResult.ok) {
      // Distinguish a malformed/truncated provider response (schema-
      // invalid or non-JSON content, even on a 200) from an actual
      // HTTP/network/timeout failure — both degrade to the corpus
      // fallback either way, but the recorded `reason` should say which
      // one happened rather than collapsing every provider failure into
      // "upstream_error" (C9A follow-up, 2026-09-05).
      return fallbackToBestWeakMatch(
        providerResult.reason === "invalid_response"
          ? "invalid_provider_response"
          : "upstream_error",
      );
    }

    const citations = validateProviderCitations(
      providerResult.value.citationIds,
      fragments.map((fragment) => {
        const source = weakMatches.find(
          (match) => match.entry.citationId === fragment.citationId,
        );
        return {
          citationId: fragment.citationId,
          label: source?.entry[locale].label ?? fragment.citationId,
        };
      }),
    );
    const answerText = providerResult.value.answer.trim();

    if (answerText === "" || citations.length === 0) {
      return fallbackToBestWeakMatch("invalid_provider_response");
    }

    recordMetric({
      outcome: "answered",
      locale,
      latencyMs: now() - startedAtMs,
    });
    return {
      httpStatus: 200,
      body: {
        status: "answered",
        locale,
        answer: truncateAnswer(answerText),
        citations,
      },
    };
  } catch {
    recordMetric({ outcome: "error", locale, latencyMs: now() - startedAtMs });
    return {
      httpStatus: 500,
      body: {
        status: "error",
        message:
          "Something went wrong answering that. Please try again or contact Diego directly.",
        correlationId: correlationId(),
      },
    };
  }
}
