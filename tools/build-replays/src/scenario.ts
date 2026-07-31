import type {
  AgentManifest,
  PolicyInput,
  ToolManifest,
} from "@portfolio/contracts";

export interface ScenarioVariant {
  readonly id: "read-allowed" | "adjust-denied";
  readonly action: PolicyInput["action"];
  readonly expected_effect: "allow" | "deny";
}

export interface ScenarioDefinition {
  readonly schema_version: "1.0.0";
  readonly scenario_version: "1.0.0";
  readonly synthetic: true;
  readonly id: "synthetic-maintenance-v1";
  readonly label: "Synthetic scenario";
  readonly fixture: {
    readonly id: "synthetic-fixture:filter-unit-7";
    readonly state: "available";
  };
  readonly agent_manifest: Omit<AgentManifest, "policy_set_sha256">;
  readonly tool_manifest: ToolManifest;
  readonly variants: readonly [ScenarioVariant, ScenarioVariant];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new Error(`${label} has missing or unknown fields`);
  }
}

export function parseScenario(source: string): ScenarioDefinition {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error("Synthetic scenario is not valid JSON", { cause: error });
  }

  if (!isRecord(value)) {
    throw new Error("Synthetic scenario must be an object");
  }
  assertExactKeys(
    value,
    [
      "schema_version",
      "scenario_version",
      "synthetic",
      "id",
      "label",
      "fixture",
      "agent_manifest",
      "tool_manifest",
      "variants",
    ],
    "Synthetic scenario",
  );

  if (
    value["schema_version"] !== "1.0.0" ||
    value["scenario_version"] !== "1.0.0" ||
    value["synthetic"] !== true ||
    value["id"] !== "synthetic-maintenance-v1" ||
    value["label"] !== "Synthetic scenario"
  ) {
    throw new Error("Synthetic scenario metadata is not the frozen v1 shape");
  }

  const fixture = value["fixture"];
  if (!isRecord(fixture)) {
    throw new Error("Synthetic scenario fixture must be an object");
  }
  assertExactKeys(fixture, ["id", "state"], "Synthetic scenario fixture");
  if (
    fixture["id"] !== "synthetic-fixture:filter-unit-7" ||
    fixture["state"] !== "available"
  ) {
    throw new Error("Synthetic scenario fixture is not the frozen v1 fixture");
  }

  const variants = value["variants"];
  if (!Array.isArray(variants) || variants.length !== 2) {
    throw new Error("Synthetic scenario must contain exactly two variants");
  }

  const expectedVariants = [
    {
      id: "read-allowed",
      action: "fixture:read",
      expected_effect: "allow",
    },
    {
      id: "adjust-denied",
      action: "fixture:adjust",
      expected_effect: "deny",
    },
  ] as const;

  expectedVariants.forEach((expected, index) => {
    const variant = variants[index];
    if (!isRecord(variant)) {
      throw new Error(`Synthetic scenario variant ${index} must be an object`);
    }
    assertExactKeys(
      variant,
      ["id", "action", "expected_effect"],
      `Synthetic scenario variant ${index}`,
    );
    if (
      variant["id"] !== expected.id ||
      variant["action"] !== expected.action ||
      variant["expected_effect"] !== expected.expected_effect
    ) {
      throw new Error(
        "Synthetic scenario variants must be read-allowed then adjust-denied",
      );
    }
  });

  if (!isRecord(value["agent_manifest"]) || !isRecord(value["tool_manifest"])) {
    throw new Error("Synthetic scenario manifests must be objects");
  }

  return value as unknown as ScenarioDefinition;
}
