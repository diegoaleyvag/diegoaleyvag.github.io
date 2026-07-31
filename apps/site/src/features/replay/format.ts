const LOGICAL_TIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/;

/** Renders a fixed synthetic logical timestamp without milliseconds. */
export function formatLogicalTime(value: string): string {
  const match = LOGICAL_TIME_PATTERN.exec(value);
  if (!match) {
    return value;
  }
  const [, date, time] = match;
  return `${date} ${time} UTC`;
}

/** Normalizes a thrown value into a short, displayable message. */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Shortens a hex digest for display while the caller keeps the full value
 * available (as the accessible name and in the raw JSON disclosure), per
 * docs/portfolio-narrative.md's editorial rule on abbreviating hashes.
 */
export function shortenDigest(
  value: string,
  prefixLength = 10,
  suffixLength = 6,
): string {
  if (value.length <= prefixLength + suffixLength + 1) {
    return value;
  }
  return `${value.slice(0, prefixLength)}\u2026${value.slice(-suffixLength)}`;
}
