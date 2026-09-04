import { readFile } from "node:fs/promises";
import path from "node:path";

import prettier from "prettier";
import { describe, expect, it } from "vitest";

import { portfolioProjectSchema } from "../src/schema.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");

describe("Five Decisions portable contract", () => {
  it("exports the canonical project schema byte-deterministically", async () => {
    const portableSchema = await readFile(
      path.join(repositoryRoot, "design/five-decisions-project.schema.json"),
      "utf8",
    );

    expect(JSON.parse(portableSchema)).toEqual(portfolioProjectSchema);
    expect(portableSchema).toBe(
      await prettier.format(JSON.stringify(portfolioProjectSchema, null, 2), {
        parser: "json",
      }),
    );
  });

  it("keeps every brand artifact on version 1.0.0", async () => {
    const [version, tokens, shell, contract] = await Promise.all([
      readFile(path.join(repositoryRoot, "design/BRAND_VERSION"), "utf8"),
      readFile(
        path.join(repositoryRoot, "design/five-decisions.tokens.json"),
        "utf8",
      ),
      readFile(
        path.join(repositoryRoot, "design/five-decisions-shell.css"),
        "utf8",
      ),
      readFile(
        path.join(repositoryRoot, "docs/five-decisions-brand-contract.md"),
        "utf8",
      ),
    ]);

    expect(version).toBe("1.0.0\n");
    expect(JSON.parse(tokens)).toMatchObject({
      brandVersion: "1.0.0",
      font: {
        display: "Big Shoulders Display",
        body: "Public Sans",
        mono: "Martian Mono",
      },
    });
    expect(shell).toContain("BRAND_VERSION=1.0.0");
    expect(contract).toContain("`BRAND_VERSION=1.0.0`");
  });
});
