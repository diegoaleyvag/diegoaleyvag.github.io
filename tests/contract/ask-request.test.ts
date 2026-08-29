import { describe, expect, it } from "vitest";

import { parseAskRequestBody } from "../../apps/site/src/lib/ask-diego/request.ts";

describe("parseAskRequestBody", () => {
  it("accepts a minimal valid request and defaults history to empty", () => {
    const result = parseAskRequestBody({
      question: "What is Prism?",
      locale: "en",
    });

    expect(result).toEqual({
      ok: true,
      value: { question: "What is Prism?", locale: "en", history: [] },
    });
  });

  it("accepts up to four bounded history turns", () => {
    const result = parseAskRequestBody({
      question: "And what about Relay?",
      locale: "en",
      history: [
        { role: "user", content: "What is Prism?" },
        { role: "assistant", content: "Prism asks..." },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it("trims surrounding whitespace from the question", () => {
    const result = parseAskRequestBody({
      question: "  What is Prism?  ",
      locale: "en",
    });

    expect(result).toEqual({
      ok: true,
      value: { question: "What is Prism?", locale: "en", history: [] },
    });
  });

  it("rejects a non-object body", () => {
    expect(parseAskRequestBody("not an object").ok).toBe(false);
    expect(parseAskRequestBody(null).ok).toBe(false);
    expect(parseAskRequestBody([1, 2, 3]).ok).toBe(false);
  });

  it("rejects an unknown top-level field", () => {
    const result = parseAskRequestBody({
      question: "What is Prism?",
      locale: "en",
      tools: ["browse"],
    });

    expect(result).toEqual({ ok: false, error: "Unknown field: tools" });
  });

  it("rejects a question shorter than the minimum length", () => {
    const result = parseAskRequestBody({ question: "hi", locale: "en" });
    expect(result.ok).toBe(false);
  });

  it("rejects an oversized question", () => {
    const result = parseAskRequestBody({
      question: "x".repeat(401),
      locale: "en",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a question that is only whitespace", () => {
    const result = parseAskRequestBody({ question: "        ", locale: "en" });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing or invalid locale", () => {
    expect(parseAskRequestBody({ question: "What is Prism?" }).ok).toBe(false);
    expect(
      parseAskRequestBody({ question: "What is Prism?", locale: "fr" }).ok,
    ).toBe(false);
  });

  it("rejects more than four history turns", () => {
    const result = parseAskRequestBody({
      question: "What is Prism?",
      locale: "en",
      history: Array.from({ length: 5 }, () => ({
        role: "user",
        content: "hi",
      })),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a history turn with an invalid role", () => {
    const result = parseAskRequestBody({
      question: "What is Prism?",
      locale: "en",
      history: [{ role: "system", content: "hi" }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a history turn with an unknown field", () => {
    const result = parseAskRequestBody({
      question: "What is Prism?",
      locale: "en",
      history: [{ role: "user", content: "hi", tool_calls: [] }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a history entry that isn't an object", () => {
    const result = parseAskRequestBody({
      question: "What is Prism?",
      locale: "en",
      history: ["hi"],
    });
    expect(result.ok).toBe(false);
  });
});
