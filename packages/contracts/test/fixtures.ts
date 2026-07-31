import { RUN_BUNDLE_SCHEMA_VERSION, type RunBundle } from "../src/index.ts";

const ZERO_SHA256 = "0".repeat(64);

const agentManifest: RunBundle["agent_manifest"] = {
  id: "synthetic:maintenance-agent",
  version: "1.0.0",
  synthetic: true,
  capabilities: ["fixture:read"],
  credential_refs: ["synthetic:maintenance-credential"],
  tool_refs: ["synthetic:fixture-catalog"],
  policy_set_sha256: ZERO_SHA256,
  status: "active",
};

const toolManifest: RunBundle["tool_manifest"] = {
  id: "synthetic:fixture-catalog",
  name: "Synthetic fixture catalog",
  version: "1.0.0",
  synthetic: true,
  argument_schema_id: "synthetic-schema:fixture-operation-input",
  result_schema_id: "synthetic-schema:fixture-operation-result",
  actions: [
    {
      action: "fixture:read",
      required_capability: "fixture:read",
      side_effect_class: "read_only",
    },
    {
      action: "fixture:adjust",
      required_capability: "fixture:adjust",
      side_effect_class: "synthetic_state_change",
    },
  ],
  limits: {
    max_calls_per_run: 1,
    max_result_bytes: 2048,
  },
};

const generator: RunBundle["generator"] = {
  name: "replay-builder",
  version: "1.0.0",
  logical_clock_start: "2030-01-01T00:00:00.000Z",
  logical_clock_step_ms: 1000,
  public_source_ids: ["opa-rego", "rfc-8785", "rfc-6962"],
};

function evidenceFor(eventCount: number): RunBundle["evidence"] {
  return {
    canonicalization: "RFC 8785",
    hash_algorithm: "SHA-256",
    merkle_construction: "RFC 6962",
    leaf_domain_prefix: "00",
    node_domain_prefix: "01",
    tree_size: eventCount,
    root_sha256: ZERO_SHA256,
    events: Array.from({ length: eventCount }, (_, index) => ({
      sequence: index + 1,
      leaf_sha256: ZERO_SHA256,
      proof: [],
    })),
  };
}

export function validAllowBundle(): RunBundle {
  const events: RunBundle["events"] = [
    {
      sequence: 1,
      event_id: "synthetic-event-read-started",
      logical_time: "2030-01-01T00:00:00.000Z",
      type: "run_started",
      summary: "Synthetic read run started.",
      data: {
        scenario_id: "synthetic-maintenance-v1",
        variant: "read-allowed",
      },
    },
    {
      sequence: 2,
      event_id: "synthetic-event-read-identity",
      logical_time: "2030-01-01T00:00:01.000Z",
      type: "identity_assessed",
      summary: "Synthetic agent capability was assessed.",
      data: {
        agent_id: "synthetic:maintenance-agent",
        required_capability: "fixture:read",
        capability_present: true,
      },
    },
    {
      sequence: 3,
      event_id: "synthetic-event-read-policy",
      logical_time: "2030-01-01T00:00:02.000Z",
      type: "policy_evaluated",
      summary: "Policy allowed the synthetic fixture read.",
      data: {
        effect: "allow",
        rule_id: "capability.fixture_read.allow",
      },
    },
    {
      sequence: 4,
      event_id: "synthetic-event-read-tool-started",
      logical_time: "2030-01-01T00:00:03.000Z",
      type: "tool_started",
      summary: "Synthetic fixture read started.",
      data: {
        tool_id: "synthetic:fixture-catalog",
        action: "fixture:read",
      },
    },
    {
      sequence: 5,
      event_id: "synthetic-event-read-tool-completed",
      logical_time: "2030-01-01T00:00:04.000Z",
      type: "tool_completed",
      summary: "Synthetic fixture read completed.",
      data: {
        tool_id: "synthetic:fixture-catalog",
        action: "fixture:read",
        result: {
          fixture_id: "synthetic-fixture:filter-unit-7",
          state: "available",
        },
      },
    },
    {
      sequence: 6,
      event_id: "synthetic-event-read-completed",
      logical_time: "2030-01-01T00:00:05.000Z",
      type: "run_completed",
      summary: "Synthetic read run completed.",
      data: { outcome: "allowed" },
    },
  ];

  return {
    schema_version: RUN_BUNDLE_SCHEMA_VERSION,
    scenario_version: "1.0.0",
    synthetic: true,
    run_id: "synthetic-run-maintenance-read-allowed",
    scenario: {
      id: "synthetic-maintenance-v1",
      label: "Synthetic scenario",
      variant: "read-allowed",
    },
    agent_manifest: agentManifest,
    tool_manifest: toolManifest,
    policy: {
      source_path: "policies/source/capability.rego",
      source_sha256: ZERO_SHA256,
      entrypoint: "data.portfolio.capability.decision",
      input: {
        schema_version: RUN_BUNDLE_SCHEMA_VERSION,
        synthetic: true,
        agent: {
          id: "synthetic:maintenance-agent",
          status: "active",
          capabilities: ["fixture:read"],
        },
        tool: {
          id: "synthetic:fixture-catalog",
          version: "1.0.0",
        },
        action: "fixture:read",
        resource: {
          id: "synthetic-fixture:filter-unit-7",
          classification: "synthetic_fixture",
        },
        arguments_sha256: ZERO_SHA256,
      },
      decision: {
        effect: "allow",
        rule_id: "capability.fixture_read.allow",
        reason: "Active agent has the required synthetic fixture capability.",
        action: "fixture:read",
        required_capability: "fixture:read",
      },
    },
    events,
    evidence: evidenceFor(events.length),
    assertions: [
      {
        id: "read-policy-allowed",
        description: "The synthetic read request is allowed.",
        passed: true,
        expected: "allow",
        actual: "allow",
      },
    ],
    generator,
  };
}

export function validDenyBundle(): RunBundle {
  const events: RunBundle["events"] = [
    {
      sequence: 1,
      event_id: "synthetic-event-adjust-started",
      logical_time: "2030-01-01T00:00:00.000Z",
      type: "run_started",
      summary: "Synthetic adjustment run started.",
      data: {
        scenario_id: "synthetic-maintenance-v1",
        variant: "adjust-denied",
      },
    },
    {
      sequence: 2,
      event_id: "synthetic-event-adjust-identity",
      logical_time: "2030-01-01T00:00:01.000Z",
      type: "identity_assessed",
      summary: "Synthetic agent capability was assessed.",
      data: {
        agent_id: "synthetic:maintenance-agent",
        required_capability: "fixture:adjust",
        capability_present: false,
      },
    },
    {
      sequence: 3,
      event_id: "synthetic-event-adjust-policy",
      logical_time: "2030-01-01T00:00:02.000Z",
      type: "policy_evaluated",
      summary: "Policy denied the synthetic fixture adjustment.",
      data: {
        effect: "deny",
        rule_id: "capability.fixture_adjust.missing",
      },
    },
    {
      sequence: 4,
      event_id: "synthetic-event-adjust-denied",
      logical_time: "2030-01-01T00:00:03.000Z",
      type: "run_denied",
      summary: "Synthetic adjustment run ended without tool execution.",
      data: {
        outcome: "denied",
        rule_id: "capability.fixture_adjust.missing",
      },
    },
  ];

  const allowBundle = validAllowBundle();
  return {
    ...allowBundle,
    run_id: "synthetic-run-maintenance-adjust-denied",
    scenario: {
      ...allowBundle.scenario,
      variant: "adjust-denied",
    },
    policy: {
      ...allowBundle.policy,
      input: {
        ...allowBundle.policy.input,
        action: "fixture:adjust",
      },
      decision: {
        effect: "deny",
        rule_id: "capability.fixture_adjust.missing",
        reason: "Active agent lacks the required synthetic fixture capability.",
        action: "fixture:adjust",
        required_capability: "fixture:adjust",
      },
    },
    events,
    evidence: evidenceFor(events.length),
    assertions: [
      {
        id: "adjust-policy-denied",
        description: "The synthetic adjustment request is denied.",
        passed: true,
        expected: "deny",
        actual: "deny",
      },
      {
        id: "denied-without-tool",
        description: "No tool event follows a denied decision.",
        passed: true,
        expected: "0 tool events",
        actual: "0 tool events",
      },
    ],
  };
}
