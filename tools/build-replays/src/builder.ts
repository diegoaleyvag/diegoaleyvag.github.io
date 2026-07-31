import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  REPLAY_MANIFEST_SCHEMA_VERSION,
  RUN_BUNDLE_SCHEMA_VERSION,
  assertReplayManifest,
  assertRunBundle,
  type DeterministicAssertionResult,
  type PolicyDecision,
  type PolicyInput,
  type ReplayManifest,
  type RunBundle,
  type RunEvent,
} from "@portfolio/contracts";
import {
  SYNTHETIC_MAINTENANCE_BUNDLE_ROOT_PATH,
  buildMerkleEvidence,
  canonicalJsonBytes,
  sha256Hex,
} from "@portfolio/replay";
import {
  FIXED_LOGICAL_CLOCK_START,
  FIXED_LOGICAL_CLOCK_STEP_MS,
  FixedLogicalClock,
  REPLAY_GENERATOR_VERSION,
  deterministicEventId,
  deterministicRunId,
} from "@portfolio/testkit";

import { workspaceRoot } from "../../opa/tool.ts";
import type { PolicyEvaluator } from "./opa-evaluator.ts";
import {
  parseScenario,
  type ScenarioDefinition,
  type ScenarioVariant,
} from "./scenario.ts";

export const SCENARIO_SOURCE_PATH =
  "content/scenarios/synthetic-maintenance-v1.json" as const;
export const POLICY_SOURCE_PATHS = [
  "policies/source/capability.rego",
  "policies/source/policy-data.json",
] as const;

export interface GeneratedReplayArtifacts {
  readonly files: ReadonlyMap<string, Uint8Array>;
  readonly bundles: readonly RunBundle[];
  readonly manifest: ReplayManifest;
  readonly policySourceSha256: string;
}

export interface BuildReplayOptions {
  readonly evaluatePolicy: PolicyEvaluator;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function inspectPolicyDecision(value: unknown): PolicyDecision {
  if (!isRecord(value)) {
    throw new Error("OPA policy decision must be an object");
  }
  const expectedKeys = [
    "action",
    "effect",
    "reason",
    "required_capability",
    "rule_id",
  ];
  const actualKeys = Object.keys(value).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error("OPA policy decision has missing or unknown fields");
  }

  const effect = value["effect"];
  const action = value["action"];
  const requiredCapability = value["required_capability"];
  const ruleId = value["rule_id"];
  const reason = value["reason"];
  if (
    !["allow", "deny", "needs_approval"].includes(String(effect)) ||
    !["fixture:read", "fixture:adjust"].includes(String(action)) ||
    !["fixture:read", "fixture:adjust"].includes(String(requiredCapability)) ||
    typeof ruleId !== "string" ||
    !/^capability\.[a-z0-9_.-]+$/.test(ruleId) ||
    typeof reason !== "string" ||
    reason.length < 1 ||
    reason.length > 240
  ) {
    throw new Error("OPA policy decision is outside the closed contract");
  }

  return value as unknown as PolicyDecision;
}

async function policyPackageDigest(): Promise<string> {
  const files = await Promise.all(
    POLICY_SOURCE_PATHS.map(async (sourcePath) => {
      const bytes = await readFile(path.join(workspaceRoot, sourcePath));
      return {
        path: sourcePath,
        byte_length: bytes.byteLength,
        sha256: await sha256Hex(bytes),
      };
    }),
  );
  return sha256Hex(canonicalJsonBytes({ files }));
}

async function loadScenario(): Promise<ScenarioDefinition> {
  const source = await readFile(
    path.join(workspaceRoot, SCENARIO_SOURCE_PATH),
    "utf8",
  );
  return parseScenario(source);
}

function buildPolicyInput(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
): Promise<PolicyInput> {
  const argumentsValue =
    variant.action === "fixture:read"
      ? { fixture_id: scenario.fixture.id }
      : {
          fixture_id: scenario.fixture.id,
          requested_state: "scheduled",
        };

  return sha256Hex(canonicalJsonBytes(argumentsValue)).then(
    (argumentsSha256): PolicyInput => ({
      schema_version: RUN_BUNDLE_SCHEMA_VERSION,
      synthetic: true,
      agent: {
        id: scenario.agent_manifest.id,
        status: scenario.agent_manifest.status,
        capabilities: [...scenario.agent_manifest.capabilities],
      },
      tool: {
        id: scenario.tool_manifest.id,
        version: scenario.tool_manifest.version,
      },
      action: variant.action,
      resource: {
        id: scenario.fixture.id,
        classification: "synthetic_fixture",
      },
      arguments_sha256: argumentsSha256,
    }),
  );
}

function buildEvents(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
  decision: PolicyDecision,
): RunEvent[] {
  const clock = new FixedLogicalClock();
  const events: RunEvent[] = [];

  const append = <Event extends RunEvent>(
    event: Omit<Event, "sequence" | "event_id" | "logical_time">,
  ): void => {
    const sequence = events.length + 1;
    events.push({
      ...event,
      sequence,
      event_id: deterministicEventId(variant.id, event.type),
      logical_time: clock.atSequence(sequence),
    } as Event);
  };

  append({
    type: "run_started",
    summary: "Synthetic scenario replay started.",
    data: {
      scenario_id: scenario.id,
      variant: variant.id,
    },
  });
  append({
    type: "identity_assessed",
    summary: "Synthetic agent capability assessment completed.",
    data: {
      agent_id: scenario.agent_manifest.id,
      required_capability: decision.required_capability,
      capability_present: scenario.agent_manifest.capabilities.includes(
        decision.required_capability,
      ),
    },
  });
  append({
    type: "policy_evaluated",
    summary:
      decision.effect === "allow"
        ? "Policy allowed the synthetic fixture action."
        : "Policy denied the synthetic fixture action.",
    data: {
      effect: decision.effect,
      rule_id: decision.rule_id,
    },
  });

  if (decision.effect === "allow") {
    append({
      type: "tool_started",
      summary: "In-memory synthetic fixture action started.",
      data: {
        tool_id: scenario.tool_manifest.id,
        action: variant.action,
      },
    });
    append({
      type: "tool_completed",
      summary: "In-memory synthetic fixture action completed.",
      data: {
        tool_id: scenario.tool_manifest.id,
        action: variant.action,
        result: {
          fixture_id: scenario.fixture.id,
          state:
            variant.action === "fixture:read"
              ? scenario.fixture.state
              : "scheduled",
        },
      },
    });
    append({
      type: "run_completed",
      summary: "Synthetic scenario replay completed.",
      data: { outcome: "allowed" },
    });
  } else {
    append({
      type: "run_denied",
      summary: "Synthetic scenario replay ended without tool execution.",
      data: {
        outcome: "denied",
        rule_id: decision.rule_id,
      },
    });
  }

  return events;
}

function buildAssertions(
  variant: ScenarioVariant,
  decision: PolicyDecision,
  events: readonly RunEvent[],
): DeterministicAssertionResult[] {
  const toolEvents = events.filter(
    ({ type }) => type === "tool_started" || type === "tool_completed",
  );
  const assertions: DeterministicAssertionResult[] = [
    {
      id: `${variant.id}-policy-effect`,
      description: "Recorded policy effect matches the finite variant.",
      passed: decision.effect === variant.expected_effect,
      expected: variant.expected_effect,
      actual: decision.effect,
    },
    {
      id: `${variant.id}-event-order`,
      description: "Event sequence is contiguous from one.",
      passed: events.every(({ sequence }, index) => sequence === index + 1),
      expected: "contiguous sequence",
      actual: events.map(({ sequence }) => sequence).join(","),
    },
  ];

  if (variant.expected_effect === "allow") {
    assertions.push({
      id: `${variant.id}-tool-completed`,
      description: "Allowed synthetic action starts and completes in memory.",
      passed:
        toolEvents.length === 2 &&
        toolEvents[0]?.type === "tool_started" &&
        toolEvents[1]?.type === "tool_completed",
      expected: "tool_started,tool_completed",
      actual: toolEvents.map(({ type }) => type).join(","),
    });
  } else {
    assertions.push({
      id: `${variant.id}-without-tool`,
      description: "Denied synthetic action has no tool execution event.",
      passed: toolEvents.length === 0,
      expected: "0 tool events",
      actual: `${toolEvents.length} tool events`,
    });
  }

  if (assertions.some(({ passed }) => !passed)) {
    throw new Error(`Deterministic assertions failed for ${variant.id}`);
  }
  return assertions;
}

async function buildBundle(
  scenario: ScenarioDefinition,
  variant: ScenarioVariant,
  policySourceSha256: string,
  evaluatePolicy: PolicyEvaluator,
): Promise<RunBundle> {
  const input = await buildPolicyInput(scenario, variant);
  const decision = inspectPolicyDecision(await evaluatePolicy(input));
  if (decision.effect !== variant.expected_effect) {
    throw new Error(
      `OPA returned ${decision.effect} for ${variant.id}; expected ${variant.expected_effect}`,
    );
  }

  const events = buildEvents(scenario, variant, decision);
  const merkle = await buildMerkleEvidence(events);
  const candidate: unknown = {
    schema_version: RUN_BUNDLE_SCHEMA_VERSION,
    scenario_version: scenario.scenario_version,
    synthetic: true,
    run_id: deterministicRunId(scenario.id, variant.id),
    scenario: {
      id: scenario.id,
      label: scenario.label,
      variant: variant.id,
    },
    agent_manifest: {
      ...scenario.agent_manifest,
      capabilities: [...scenario.agent_manifest.capabilities],
      credential_refs: [...scenario.agent_manifest.credential_refs],
      tool_refs: [...scenario.agent_manifest.tool_refs],
      policy_set_sha256: policySourceSha256,
    },
    tool_manifest: {
      ...scenario.tool_manifest,
      actions: scenario.tool_manifest.actions.map((action) => ({ ...action })),
      limits: { ...scenario.tool_manifest.limits },
    },
    policy: {
      source_path: POLICY_SOURCE_PATHS[0],
      source_sha256: policySourceSha256,
      entrypoint: "data.portfolio.capability.decision",
      input,
      decision,
    },
    events,
    evidence: {
      canonicalization: "RFC 8785",
      hash_algorithm: "SHA-256",
      merkle_construction: "RFC 6962",
      leaf_domain_prefix: "00",
      node_domain_prefix: "01",
      tree_size: events.length,
      root_sha256: merkle.rootSha256,
      events: merkle.events,
    },
    assertions: buildAssertions(variant, decision, events),
    generator: {
      name: "replay-builder",
      version: REPLAY_GENERATOR_VERSION,
      logical_clock_start: FIXED_LOGICAL_CLOCK_START,
      logical_clock_step_ms: FIXED_LOGICAL_CLOCK_STEP_MS,
      public_source_ids: ["opa-rego", "rfc-8785", "rfc-6962"],
    },
  };

  assertRunBundle(candidate);
  return candidate;
}

function encodeArtifact(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

export async function buildReplayArtifacts({
  evaluatePolicy,
}: BuildReplayOptions): Promise<GeneratedReplayArtifacts> {
  const scenario = await loadScenario();
  const policySourceSha256 = await policyPackageDigest();
  const bundles = await Promise.all(
    scenario.variants.map((variant) =>
      buildBundle(scenario, variant, policySourceSha256, evaluatePolicy),
    ),
  );

  const bundleBytes = bundles.map((bundle) => encodeArtifact(bundle));
  const entries = await Promise.all(
    bundles.map(async (bundle, index) => {
      const bytes = bundleBytes[index];
      if (bytes === undefined) {
        throw new Error(
          `Missing generated bytes for ${bundle.scenario.variant}`,
        );
      }
      return {
        scenario_id: bundle.scenario.id,
        scenario_version: bundle.scenario_version,
        variant: bundle.scenario.variant,
        path: `${SYNTHETIC_MAINTENANCE_BUNDLE_ROOT_PATH}${bundle.scenario.variant}.json`,
        schema_version: bundle.schema_version,
        byte_length: bytes.byteLength,
        sha256: await sha256Hex(bytes),
      };
    }),
  );

  const manifestCandidate: unknown = {
    schema_version: REPLAY_MANIFEST_SCHEMA_VERSION,
    synthetic: true,
    generated_at: FIXED_LOGICAL_CLOCK_START,
    generator_version: REPLAY_GENERATOR_VERSION,
    entries,
  };
  assertReplayManifest(manifestCandidate);

  const files = new Map<string, Uint8Array>();
  bundles.forEach((bundle, index) => {
    const bytes = bundleBytes[index];
    if (bytes === undefined) {
      throw new Error(`Missing generated bytes for ${bundle.scenario.variant}`);
    }
    files.set(`${bundle.scenario.id}/${bundle.scenario.variant}.json`, bytes);
  });
  files.set("manifest.json", encodeArtifact(manifestCandidate));

  return {
    files,
    bundles,
    manifest: manifestCandidate,
    policySourceSha256,
  };
}
