/**
 * The rate limiter's key is an opaque, client-generated session identifier
 * sent as a plain request header (`x-ask-session-id`) — never an IP
 * address, and deliberately never a browser `Cookie`/`Set-Cookie` either.
 * `docs/threat-model.md`'s CSRF control set already commits `/api/ask` to
 * "JSON-only POST, no cookies, no browser credentials"; a header the
 * client's own island JS sets (a random id kept in `sessionStorage`, see
 * `apps/site/src/features/ask-diego/AskGuide.tsx`) delivers the same
 * "opaque per-session, not per-IP" property the rate limiter needs without
 * reopening that control. A request with no header — a script calling the
 * endpoint directly, or a no-JS `fetch` — falls into one shared
 * "anonymous" bucket, which is a conservative, coarser limit rather than a
 * bypass.
 */
const SESSION_HEADER_NAME = "x-ask-session-id";
const MAX_SESSION_ID_LENGTH = 128;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const ANONYMOUS_SESSION_KEY = "anonymous";

export function extractSessionKey(request: Request): string {
  const header = request.headers.get(SESSION_HEADER_NAME);
  if (
    header !== null &&
    header.length <= MAX_SESSION_ID_LENGTH &&
    SESSION_ID_PATTERN.test(header)
  ) {
    return header;
  }
  return ANONYMOUS_SESSION_KEY;
}

export { SESSION_HEADER_NAME };
