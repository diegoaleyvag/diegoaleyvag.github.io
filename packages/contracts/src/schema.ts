export const RUN_BUNDLE_SCHEMA_VERSION = "1.0.0" as const;
export const REPLAY_MANIFEST_SCHEMA_VERSION = "1.0.0" as const;

const digestPattern = "^[a-f0-9]{64}$";
const identifierPattern = "^[a-z0-9][a-z0-9-]*$";
const syntheticIdentifierPattern = "^synthetic:[a-z0-9][a-z0-9-]*$";

export const runBundleSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/portfolio/run-bundle/v1",
  title: "RunBundle v1",
  description:
    "Closed cross-boundary contract for one visibly synthetic governed replay run.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "scenario_version",
    "synthetic",
    "run_id",
    "scenario",
    "agent_manifest",
    "tool_manifest",
    "policy",
    "events",
    "evidence",
    "assertions",
    "generator",
  ],
  properties: {
    schema_version: { const: RUN_BUNDLE_SCHEMA_VERSION },
    scenario_version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
    },
    synthetic: { const: true },
    run_id: {
      type: "string",
      pattern: "^synthetic-run-[a-z0-9-]+$",
    },
    scenario: { $ref: "#/$defs/scenarioReference" },
    agent_manifest: { $ref: "#/$defs/agentManifest" },
    tool_manifest: { $ref: "#/$defs/toolManifest" },
    policy: { $ref: "#/$defs/policyRecord" },
    events: {
      type: "array",
      minItems: 4,
      uniqueItems: true,
      items: { $ref: "#/$defs/runEvent" },
    },
    provider_result: { $ref: "#/$defs/providerResult" },
    trace: { $ref: "#/$defs/trace" },
    evidence: { $ref: "#/$defs/evidence" },
    assertions: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/assertionResult" },
    },
    generator: { $ref: "#/$defs/generatorMetadata" },
  },
  $defs: {
    scenarioReference: {
      type: "object",
      additionalProperties: false,
      required: ["id", "label", "variant"],
      properties: {
        id: { type: "string", pattern: identifierPattern },
        label: { const: "Synthetic scenario" },
        variant: { type: "string", pattern: identifierPattern },
      },
    },
    agentManifest: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "version",
        "synthetic",
        "capabilities",
        "credential_refs",
        "tool_refs",
        "policy_set_sha256",
        "status",
      ],
      properties: {
        id: { type: "string", pattern: syntheticIdentifierPattern },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        synthetic: { const: true },
        capabilities: {
          type: "array",
          uniqueItems: true,
          items: {
            type: "string",
            pattern: "^fixture:(read|adjust)$",
          },
        },
        credential_refs: {
          type: "array",
          uniqueItems: true,
          items: { type: "string", pattern: syntheticIdentifierPattern },
        },
        tool_refs: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: { type: "string", pattern: syntheticIdentifierPattern },
        },
        policy_set_sha256: { type: "string", pattern: digestPattern },
        status: { enum: ["active", "suspended", "revoked"] },
      },
    },
    toolManifest: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "name",
        "version",
        "synthetic",
        "argument_schema_id",
        "result_schema_id",
        "actions",
        "limits",
      ],
      properties: {
        id: { type: "string", pattern: syntheticIdentifierPattern },
        name: { type: "string", minLength: 1 },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        synthetic: { const: true },
        argument_schema_id: {
          type: "string",
          pattern: "^synthetic-schema:[a-z0-9-]+$",
        },
        result_schema_id: {
          type: "string",
          pattern: "^synthetic-schema:[a-z0-9-]+$",
        },
        actions: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["action", "required_capability", "side_effect_class"],
            properties: {
              action: { enum: ["fixture:read", "fixture:adjust"] },
              required_capability: {
                enum: ["fixture:read", "fixture:adjust"],
              },
              side_effect_class: {
                enum: ["read_only", "synthetic_state_change"],
              },
            },
          },
        },
        limits: {
          type: "object",
          additionalProperties: false,
          required: ["max_calls_per_run", "max_result_bytes"],
          properties: {
            max_calls_per_run: { type: "integer", minimum: 1, maximum: 10 },
            max_result_bytes: {
              type: "integer",
              minimum: 1,
              maximum: 16384,
            },
          },
        },
      },
    },
    policyInput: {
      type: "object",
      additionalProperties: false,
      required: [
        "schema_version",
        "synthetic",
        "agent",
        "tool",
        "action",
        "resource",
        "arguments_sha256",
      ],
      properties: {
        schema_version: { const: RUN_BUNDLE_SCHEMA_VERSION },
        synthetic: { const: true },
        agent: {
          type: "object",
          additionalProperties: false,
          required: ["id", "status", "capabilities"],
          properties: {
            id: { type: "string", pattern: syntheticIdentifierPattern },
            status: { enum: ["active", "suspended", "revoked"] },
            capabilities: {
              type: "array",
              uniqueItems: true,
              items: {
                type: "string",
                pattern: "^fixture:(read|adjust)$",
              },
            },
          },
        },
        tool: {
          type: "object",
          additionalProperties: false,
          required: ["id", "version"],
          properties: {
            id: { type: "string", pattern: syntheticIdentifierPattern },
            version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
          },
        },
        action: { enum: ["fixture:read", "fixture:adjust"] },
        resource: {
          type: "object",
          additionalProperties: false,
          required: ["id", "classification"],
          properties: {
            id: {
              type: "string",
              pattern: "^synthetic-fixture:[a-z0-9-]+$",
            },
            classification: { const: "synthetic_fixture" },
          },
        },
        arguments_sha256: { type: "string", pattern: digestPattern },
      },
    },
    policyDecision: {
      type: "object",
      additionalProperties: false,
      required: [
        "effect",
        "rule_id",
        "reason",
        "action",
        "required_capability",
      ],
      properties: {
        effect: { enum: ["allow", "deny", "needs_approval"] },
        rule_id: {
          type: "string",
          pattern: "^capability\\.[a-z0-9_.-]+$",
        },
        reason: { type: "string", minLength: 1, maxLength: 240 },
        action: { enum: ["fixture:read", "fixture:adjust"] },
        required_capability: {
          enum: ["fixture:read", "fixture:adjust"],
        },
      },
    },
    policyRecord: {
      type: "object",
      additionalProperties: false,
      required: [
        "source_path",
        "source_sha256",
        "entrypoint",
        "input",
        "decision",
      ],
      properties: {
        source_path: {
          type: "string",
          pattern: "^policies/source/[a-z0-9/_-]+\\.rego$",
        },
        source_sha256: { type: "string", pattern: digestPattern },
        entrypoint: { const: "data.portfolio.capability.decision" },
        input: { $ref: "#/$defs/policyInput" },
        decision: { $ref: "#/$defs/policyDecision" },
      },
    },
    eventBaseProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        sequence: { type: "integer", minimum: 1 },
        event_id: {
          type: "string",
          pattern: "^synthetic-event-[a-z0-9-]+$",
        },
        logical_time: { type: "string", format: "date-time" },
        summary: { type: "string", minLength: 1, maxLength: 240 },
      },
    },
    runStartedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "run_started" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["scenario_id", "variant"],
          properties: {
            scenario_id: { type: "string", pattern: identifierPattern },
            variant: { type: "string", pattern: identifierPattern },
          },
        },
      },
    },
    identityAssessedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "identity_assessed" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["agent_id", "required_capability", "capability_present"],
          properties: {
            agent_id: { type: "string", pattern: syntheticIdentifierPattern },
            required_capability: {
              enum: ["fixture:read", "fixture:adjust"],
            },
            capability_present: { type: "boolean" },
          },
        },
      },
    },
    policyEvaluatedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "policy_evaluated" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["effect", "rule_id"],
          properties: {
            effect: { enum: ["allow", "deny", "needs_approval"] },
            rule_id: {
              type: "string",
              pattern: "^capability\\.[a-z0-9_.-]+$",
            },
          },
        },
      },
    },
    toolStartedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "tool_started" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["tool_id", "action"],
          properties: {
            tool_id: { type: "string", pattern: syntheticIdentifierPattern },
            action: { enum: ["fixture:read", "fixture:adjust"] },
          },
        },
      },
    },
    toolCompletedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "tool_completed" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["tool_id", "action", "result"],
          properties: {
            tool_id: { type: "string", pattern: syntheticIdentifierPattern },
            action: { enum: ["fixture:read", "fixture:adjust"] },
            result: {
              type: "object",
              additionalProperties: false,
              required: ["fixture_id", "state"],
              properties: {
                fixture_id: {
                  type: "string",
                  pattern: "^synthetic-fixture:[a-z0-9-]+$",
                },
                state: { enum: ["available", "scheduled"] },
              },
            },
          },
        },
      },
    },
    runCompletedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "run_completed" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["outcome"],
          properties: {
            outcome: { const: "allowed" },
          },
        },
      },
    },
    runDeniedEvent: {
      type: "object",
      additionalProperties: false,
      required: [
        "sequence",
        "event_id",
        "logical_time",
        "type",
        "summary",
        "data",
      ],
      properties: {
        sequence: { $ref: "#/$defs/eventBaseProperties/properties/sequence" },
        event_id: { $ref: "#/$defs/eventBaseProperties/properties/event_id" },
        logical_time: {
          $ref: "#/$defs/eventBaseProperties/properties/logical_time",
        },
        type: { const: "run_denied" },
        summary: { $ref: "#/$defs/eventBaseProperties/properties/summary" },
        data: {
          type: "object",
          additionalProperties: false,
          required: ["outcome", "rule_id"],
          properties: {
            outcome: { const: "denied" },
            rule_id: {
              type: "string",
              pattern: "^capability\\.[a-z0-9_.-]+$",
            },
          },
        },
      },
    },
    runEvent: {
      oneOf: [
        { $ref: "#/$defs/runStartedEvent" },
        { $ref: "#/$defs/identityAssessedEvent" },
        { $ref: "#/$defs/policyEvaluatedEvent" },
        { $ref: "#/$defs/toolStartedEvent" },
        { $ref: "#/$defs/toolCompletedEvent" },
        { $ref: "#/$defs/runCompletedEvent" },
        { $ref: "#/$defs/runDeniedEvent" },
      ],
    },
    providerResult: {
      type: "object",
      additionalProperties: false,
      required: [
        "provider_kind",
        "provider_label",
        "model_label",
        "text",
        "tool_call_intents",
        "finish_reason",
        "quota_observations",
      ],
      properties: {
        provider_kind: { enum: ["fake", "replay", "live"] },
        provider_label: { type: "string", minLength: 1 },
        model_label: { type: "string", minLength: 1 },
        text: { type: "string" },
        tool_call_intents: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "arguments_sha256"],
            properties: {
              name: { type: "string", minLength: 1 },
              arguments_sha256: { type: "string", pattern: digestPattern },
            },
          },
        },
        finish_reason: {
          enum: ["stop", "tool_calls", "length", "cancelled", "unknown"],
        },
        usage: {
          type: "object",
          additionalProperties: false,
          required: ["input_tokens", "output_tokens"],
          properties: {
            input_tokens: { type: "integer", minimum: 0 },
            output_tokens: { type: "integer", minimum: 0 },
          },
        },
        quota_observations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "value"],
            properties: {
              name: {
                enum: [
                  "limit",
                  "remaining",
                  "reset_after_ms",
                  "retry_after_ms",
                ],
              },
              value: {
                oneOf: [{ type: "integer", minimum: 0 }, { type: "null" }],
              },
            },
          },
        },
      },
    },
    trace: {
      type: "object",
      additionalProperties: false,
      required: ["trace_id", "spans"],
      properties: {
        trace_id: { type: "string", pattern: "^[a-f0-9]{32}$" },
        spans: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "span_id",
              "name",
              "start_logical_time",
              "end_logical_time",
              "status",
              "attributes",
            ],
            properties: {
              span_id: { type: "string", pattern: "^[a-f0-9]{16}$" },
              parent_span_id: {
                type: "string",
                pattern: "^[a-f0-9]{16}$",
              },
              name: { type: "string", minLength: 1 },
              start_logical_time: { type: "string", format: "date-time" },
              end_logical_time: { type: "string", format: "date-time" },
              status: { enum: ["unset", "ok", "error"] },
              attributes: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["key", "value"],
                  properties: {
                    key: {
                      type: "string",
                      pattern: "^synthetic\\.[a-z0-9_.-]+$",
                    },
                    value: {
                      oneOf: [
                        { type: "string", maxLength: 120 },
                        { type: "number" },
                        { type: "boolean" },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    proofStep: {
      type: "object",
      additionalProperties: false,
      required: ["position", "sha256"],
      properties: {
        position: { enum: ["left", "right"] },
        sha256: { type: "string", pattern: digestPattern },
      },
    },
    eventEvidence: {
      type: "object",
      additionalProperties: false,
      required: ["sequence", "leaf_sha256", "proof"],
      properties: {
        sequence: { type: "integer", minimum: 1 },
        leaf_sha256: { type: "string", pattern: digestPattern },
        proof: {
          type: "array",
          items: { $ref: "#/$defs/proofStep" },
        },
      },
    },
    evidence: {
      type: "object",
      additionalProperties: false,
      required: [
        "canonicalization",
        "hash_algorithm",
        "merkle_construction",
        "leaf_domain_prefix",
        "node_domain_prefix",
        "tree_size",
        "root_sha256",
        "events",
      ],
      properties: {
        canonicalization: { const: "RFC 8785" },
        hash_algorithm: { const: "SHA-256" },
        merkle_construction: { const: "RFC 6962" },
        leaf_domain_prefix: { const: "00" },
        node_domain_prefix: { const: "01" },
        tree_size: { type: "integer", minimum: 1 },
        root_sha256: { type: "string", pattern: digestPattern },
        events: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/$defs/eventEvidence" },
        },
      },
    },
    assertionResult: {
      type: "object",
      additionalProperties: false,
      required: ["id", "description", "passed", "expected", "actual"],
      properties: {
        id: { type: "string", pattern: identifierPattern },
        description: { type: "string", minLength: 1, maxLength: 240 },
        passed: { type: "boolean" },
        expected: { type: "string", maxLength: 240 },
        actual: { type: "string", maxLength: 240 },
      },
    },
    generatorMetadata: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "version",
        "logical_clock_start",
        "logical_clock_step_ms",
        "public_source_ids",
      ],
      properties: {
        name: { const: "replay-builder" },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        logical_clock_start: { type: "string", format: "date-time" },
        logical_clock_step_ms: {
          type: "integer",
          minimum: 1,
          maximum: 60000,
        },
        public_source_ids: {
          type: "array",
          minItems: 3,
          uniqueItems: true,
          items: { enum: ["opa-rego", "rfc-8785", "rfc-6962"] },
        },
      },
    },
  },
} as const;

export const replayManifestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/portfolio/replay-manifest/v1",
  title: "Replay manifest v1",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "synthetic",
    "generated_at",
    "generator_version",
    "entries",
  ],
  properties: {
    schema_version: { const: REPLAY_MANIFEST_SCHEMA_VERSION },
    synthetic: { const: true },
    generated_at: { type: "string", format: "date-time" },
    generator_version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
    },
    entries: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "scenario_id",
          "scenario_version",
          "variant",
          "path",
          "schema_version",
          "byte_length",
          "sha256",
        ],
        properties: {
          scenario_id: { type: "string", pattern: identifierPattern },
          scenario_version: {
            type: "string",
            pattern: "^\\d+\\.\\d+\\.\\d+$",
          },
          variant: { type: "string", pattern: identifierPattern },
          path: {
            type: "string",
            pattern: "^/replays/v1/[a-z0-9-]+/[a-z0-9-]+\\.json$",
          },
          schema_version: { const: RUN_BUNDLE_SCHEMA_VERSION },
          byte_length: { type: "integer", minimum: 1 },
          sha256: { type: "string", pattern: digestPattern },
        },
      },
    },
  },
} as const;
