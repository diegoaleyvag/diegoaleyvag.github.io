/**
 * Client-side half of the opaque session identifier described in
 * `apps/site/src/lib/ask-diego/session.ts`: a random id, generated once per
 * browser tab session and kept in `sessionStorage` (not a cookie — no
 * `Set-Cookie`, no browser credential, never sent anywhere but this one
 * custom header), sent as `x-ask-session-id` so the server's rate limiter
 * can key on something other than an IP address. If storage is unavailable
 * (private browsing, disabled storage) the id simply isn't persisted across
 * reloads — the request still succeeds, just under the server's shared
 * "anonymous" bucket.
 */
const STORAGE_KEY = "ask-diego-session-id";

function randomId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateClientSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing !== null && existing.length > 0) {
      return existing;
    }
    const created = randomId();
    window.sessionStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}
