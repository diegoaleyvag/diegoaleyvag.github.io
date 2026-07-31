import { spawnSync } from "node:child_process";
import path from "node:path";

import type { PolicyInput } from "@portfolio/contracts";

import { assertPinnedOpa, workspaceRoot } from "../../opa/tool.ts";

export type PolicyEvaluator = (input: PolicyInput) => Promise<unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractDecision(source: string): unknown {
  let envelope: unknown;
  try {
    envelope = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error("OPA returned malformed JSON", { cause: error });
  }

  if (!isRecord(envelope)) {
    throw new Error("OPA result envelope must be an object");
  }
  const results = envelope["result"];
  if (!Array.isArray(results) || results.length !== 1) {
    throw new Error("OPA must return exactly one policy result");
  }
  const result = results[0];
  if (!isRecord(result)) {
    throw new Error("OPA policy result must be an object");
  }
  const expressions = result["expressions"];
  if (!Array.isArray(expressions) || expressions.length !== 1) {
    throw new Error("OPA must return exactly one policy expression");
  }
  const expression = expressions[0];
  if (!isRecord(expression) || !Object.hasOwn(expression, "value")) {
    throw new Error("OPA policy expression has no decision value");
  }
  return expression["value"];
}

export async function createOpaPolicyEvaluator(): Promise<PolicyEvaluator> {
  const executablePath = await assertPinnedOpa();
  const policyDirectory = path.join(workspaceRoot, "policies", "source");

  return async (input: PolicyInput): Promise<unknown> => {
    const result = spawnSync(
      executablePath,
      [
        "eval",
        "--format=json",
        "--data",
        policyDirectory,
        "--stdin-input",
        "data.portfolio.capability.decision",
      ],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        input: JSON.stringify(input),
        maxBuffer: 1024 * 1024,
      },
    );

    if (result.error !== undefined) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(
        `OPA evaluation failed with exit ${result.status ?? "unknown"}: ${result.stderr.trim()}`,
      );
    }
    return extractDecision(result.stdout);
  };
}
