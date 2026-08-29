/**
 * The browser-safe half of the `/api/ask` contract: this file only knows
 * the wire shape (a plain `fetch` and the JSON it returns), never anything
 * from `apps/site/src/lib/ask-diego/**` (server-only — corpus data,
 * provider credential, rate-limiter internals). That boundary is
 * deliberate, not incidental: `.cursor/rules/frontend.mdc` forbids
 * browser-reachable code from importing server-only Ask-Diego modules.
 */

export type AskLocale = "en" | "es";

export interface AskCitation {
  readonly id: string;
  readonly label: string;
}

export interface AskHistoryTurn {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export type AskClientResponseBody =
  | {
      readonly status: "answered";
      readonly locale: AskLocale;
      readonly answer: string;
      readonly citations: readonly AskCitation[];
    }
  | {
      readonly status: "fallback";
      readonly locale: AskLocale;
      readonly answer: string;
      readonly citations: readonly AskCitation[];
      readonly reason: string;
    }
  | {
      readonly status: "rate_limited";
      readonly locale: AskLocale;
      readonly retryAfterSeconds: number;
    }
  | {
      readonly status: "error";
      readonly message: string;
      readonly correlationId: string;
    };

export interface AskApiResult {
  readonly httpStatus: number;
  readonly body: AskClientResponseBody;
}

export interface CallAskApiInput {
  readonly question: string;
  readonly locale: AskLocale;
  readonly history: readonly AskHistoryTurn[];
  readonly sessionId: string;
}

const NETWORK_ERROR_BODY: AskClientResponseBody = {
  status: "error",
  message: "network_unreachable",
  correlationId: "client-network-error",
};

/**
 * Calls the one dynamic route from the browser. Any network failure (fetch
 * throwing, offline, CORS) or a response body that isn't valid JSON
 * collapses to the same generic client-side error shape — the UI never
 * shows a raw exception (`AskGuide.tsx`'s "clear ... error ... states").
 */
export async function callAskApi(
  input: CallAskApiInput,
): Promise<AskApiResult> {
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ask-session-id": input.sessionId,
      },
      body: JSON.stringify({
        question: input.question,
        locale: input.locale,
        history: input.history,
      }),
    });
    const body = (await response.json()) as AskClientResponseBody;
    return { httpStatus: response.status, body };
  } catch {
    return { httpStatus: 0, body: NETWORK_ERROR_BODY };
  }
}
