import type { CorpusEntry } from "@portfolio/ask-corpus";

import type { AskCitation, AskLocale } from "./types.ts";

/** The `.cursor/rules/ai-guide.mdc` guideline, enforced on every answer that leaves this module. */
export const ANSWER_GUIDELINE_LENGTH = 280;

/**
 * A model-generated answer gets graceful truncation rather than outright
 * rejection (curated corpus content is instead schema-rejected outright at
 * authoring time — see `packages/ask-corpus/src/schema.ts` — since there's
 * no excuse for a hand-written string to run long). This ceiling gives a
 * little slack over the guideline before truncating at a word boundary.
 */
export const ANSWER_TRUNCATE_CEILING = 320;

export function truncateAnswer(
  answer: string,
  ceiling: number = ANSWER_TRUNCATE_CEILING,
): string {
  const trimmed = answer.trim();
  if (trimmed.length <= ceiling) {
    return trimmed;
  }
  const sliced = trimmed.slice(0, ceiling);
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace > ceiling * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${safe.trimEnd()}…`;
}

export function citationFromEntry(
  entry: CorpusEntry,
  locale: AskLocale,
): AskCitation {
  return { id: entry.citationId, label: entry[locale].label };
}

export interface CitableFragment {
  readonly citationId: string;
  readonly label: string;
}

/**
 * The one place a model-proposed citation is trusted: only ids present in
 * the fragments actually sent to the provider survive, each at most once,
 * in the order the model returned them. Everything else is silently
 * dropped — never surfaced as an error to the visitor, since a partially
 * unciteable answer is still better than none (threat-model.md: "every
 * citation must reference an ID actually present in the retrieved
 * context").
 */
export function validateProviderCitations(
  citationIds: readonly string[],
  allowedFragments: readonly CitableFragment[],
): readonly AskCitation[] {
  const allowed = new Map(
    allowedFragments.map((fragment) => [fragment.citationId, fragment.label]),
  );
  const seen = new Set<string>();
  const result: AskCitation[] = [];

  for (const id of citationIds) {
    const label = allowed.get(id);
    if (label !== undefined && !seen.has(id)) {
      seen.add(id);
      result.push({ id, label });
    }
  }

  return result;
}
