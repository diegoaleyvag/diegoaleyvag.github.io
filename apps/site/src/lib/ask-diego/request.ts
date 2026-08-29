import type { AskHistoryTurn, AskLocale, AskRequestBody } from "./types.ts";

export const MIN_QUESTION_LENGTH = 4;
export const MAX_QUESTION_LENGTH = 400;
export const MAX_HISTORY_TURNS = 4;
export const MAX_HISTORY_TURN_LENGTH = 400;

export type ParseAskRequestResult =
  | { readonly ok: true; readonly value: AskRequestBody }
  | { readonly ok: false; readonly error: string };

function fail(error: string): ParseAskRequestResult {
  return { ok: false, error };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseHistoryTurn(
  value: unknown,
  index: number,
):
  | { readonly ok: true; readonly value: AskHistoryTurn }
  | { readonly ok: false; readonly error: string } {
  if (!isPlainObject(value)) {
    return { ok: false, error: `history[${index}] must be an object` };
  }
  const allowedKeys = new Set(["role", "content"]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return { ok: false, error: `history[${index}] has an unknown field` };
    }
  }
  const { role, content } = value;
  if (role !== "user" && role !== "assistant") {
    return {
      ok: false,
      error: `history[${index}].role must be "user" or "assistant"`,
    };
  }
  if (
    typeof content !== "string" ||
    content.trim().length === 0 ||
    content.length > MAX_HISTORY_TURN_LENGTH
  ) {
    return {
      ok: false,
      error: `history[${index}].content must be a non-empty string up to ${MAX_HISTORY_TURN_LENGTH} characters`,
    };
  }
  return { ok: true, value: { role, content: content.trim() } };
}

/**
 * Validates the closed `/api/ask` request contract: `{ question, locale,
 * history? }`, no unknown fields, bounded lengths at every level. Returns a
 * plain string on failure so the caller can turn it into a clean `400`
 * without ever forwarding a stack trace (`.cursor/rules/security.mdc`).
 */
export function parseAskRequestBody(raw: unknown): ParseAskRequestResult {
  if (!isPlainObject(raw)) {
    return fail("Request body must be a JSON object");
  }

  const allowedKeys = new Set(["question", "locale", "history"]);
  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      return fail(`Unknown field: ${key}`);
    }
  }

  const { question, locale, history } = raw;

  if (typeof question !== "string") {
    return fail("question must be a string");
  }
  const trimmedQuestion = question.trim();
  if (
    trimmedQuestion.length < MIN_QUESTION_LENGTH ||
    trimmedQuestion.length > MAX_QUESTION_LENGTH
  ) {
    return fail(
      `question must be between ${MIN_QUESTION_LENGTH} and ${MAX_QUESTION_LENGTH} characters`,
    );
  }

  if (locale !== "en" && locale !== "es") {
    return fail('locale must be "en" or "es"');
  }
  const parsedLocale: AskLocale = locale;

  if (history === undefined) {
    return {
      ok: true,
      value: { question: trimmedQuestion, locale: parsedLocale, history: [] },
    };
  }

  if (!Array.isArray(history)) {
    return fail("history must be an array");
  }
  if (history.length > MAX_HISTORY_TURNS) {
    return fail(`history must include at most ${MAX_HISTORY_TURNS} turns`);
  }

  const parsedTurns: AskHistoryTurn[] = [];
  for (const [index, entry] of history.entries()) {
    const parsed = parseHistoryTurn(entry, index);
    if (!parsed.ok) {
      return fail(parsed.error);
    }
    parsedTurns.push(parsed.value);
  }

  return {
    ok: true,
    value: {
      question: trimmedQuestion,
      locale: parsedLocale,
      history: parsedTurns,
    },
  };
}
