export async function sha256Bytes(value: Uint8Array): Promise<Uint8Array> {
  const copy = Uint8Array.from(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", copy);
  return new Uint8Array(digest);
}

export async function sha256Hex(value: Uint8Array): Promise<string> {
  return bytesToHex(await sha256Bytes(value));
}

export function bytesToHex(value: Uint8Array): string {
  return [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(value: string): Uint8Array {
  if (!/^[a-f0-9]+$/.test(value) || value.length % 2 !== 0) {
    throw new TypeError("Expected an even-length lowercase hexadecimal value");
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function concatenateBytes(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(
    parts.reduce((length, part) => length + part.byteLength, 0),
  );
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}
