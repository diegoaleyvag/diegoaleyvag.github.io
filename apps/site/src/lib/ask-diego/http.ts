/**
 * Generous enough for a <=400-character question plus up to four <=400-character
 * history turns and their JSON punctuation, with headroom — small enough that
 * an attacker gains nothing by sending more.
 */
export const MAX_REQUEST_BODY_BYTES = 8_192;

export type ReadJsonBodyResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: string };

function concatenateChunks(chunks: readonly Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

/**
 * Rejects the wrong content type, an oversized declared `Content-Length`,
 * and an oversized *actual* body (streamed and counted, not trusted from
 * the header alone) before ever handing bytes to `JSON.parse` —
 * `.cursor/rules/security.mdc`: "Reject oversized bodies, wrong content
 * types, and unknown fields on `/api/ask` before touching a provider."
 */
export async function readBoundedJsonBody(
  request: Request,
  maxBytes: number = MAX_REQUEST_BODY_BYTES,
): Promise<ReadJsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, error: "Content-Type must be application/json" };
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, error: "Request body is too large" };
  }

  const body = request.body;
  if (body === null) {
    return { ok: false, error: "Request body is required" };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value !== undefined) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          return { ok: false, error: "Request body is too large" };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { ok: false, error: "Unable to read request body" };
  }

  if (totalBytes === 0) {
    return { ok: false, error: "Request body is required" };
  }

  const text = new TextDecoder().decode(concatenateChunks(chunks));
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: "Request body must be valid JSON" };
  }
}
