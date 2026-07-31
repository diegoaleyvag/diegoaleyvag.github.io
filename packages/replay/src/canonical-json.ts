export type JsonPrimitive = boolean | null | number | string;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

function assertValidUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError("RFC 8785 rejects an unpaired high surrogate");
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new TypeError("RFC 8785 rejects an unpaired low surrogate");
    }
  }
}

function serialize(value: unknown, ancestors: WeakSet<object>): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    assertValidUnicode(value);
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("RFC 8785 accepts only finite IEEE-754 numbers");
    }
    return JSON.stringify(value);
  }

  if (typeof value !== "object") {
    throw new TypeError(`Value of type ${typeof value} is not JSON data`);
  }

  if (ancestors.has(value)) {
    throw new TypeError("Cannot canonicalize cyclic JSON data");
  }
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => serialize(item, ancestors)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("RFC 8785 accepts only plain JSON objects");
    }

    const objectValue = value as Readonly<Record<string, unknown>>;
    const properties = Object.keys(objectValue)
      .sort()
      .map((key) => {
        assertValidUnicode(key);
        return `${JSON.stringify(key)}:${serialize(objectValue[key], ancestors)}`;
      });
    return `{${properties.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalizeJson(value: unknown): string {
  return serialize(value, new WeakSet());
}

export function canonicalJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalizeJson(value));
}
