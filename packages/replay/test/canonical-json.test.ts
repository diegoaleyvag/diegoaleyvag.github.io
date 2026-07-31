import { describe, expect, it } from "vitest";

import { canonicalizeJson } from "../src/index.ts";

describe("RFC 8785 JSON canonicalization", () => {
  it("sorts object keys by UTF-16 code units without changing array order", () => {
    expect(
      canonicalizeJson({
        z: [3, 2, 1],
        a: { d: true, c: null },
      }),
    ).toBe('{"a":{"c":null,"d":true},"z":[3,2,1]}');
  });

  it("uses ECMAScript number serialization required by JCS", () => {
    expect(
      canonicalizeJson([
        Number("333333333.33333329"),
        1e30,
        4.5,
        0.002,
        1e-27,
        -0,
      ]),
    ).toBe("[333333333.3333333,1e+30,4.5,0.002,1e-27,0]");
  });

  it("rejects non-JSON and invalid Unicode values", () => {
    expect(() => canonicalizeJson(Number.NaN)).toThrow(/finite/);
    expect(() => canonicalizeJson({ value: undefined })).toThrow(/not JSON/);
    expect(() => canonicalizeJson("\ud800")).toThrow(/unpaired high surrogate/);
  });
});
