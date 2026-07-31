import type { FromSchema } from "json-schema-to-ts";

import type { replayManifestSchema, runBundleSchema } from "./schema.ts";

export type RunBundle = FromSchema<typeof runBundleSchema>;
export type ReplayManifest = FromSchema<typeof replayManifestSchema>;

export type AgentManifest = RunBundle["agent_manifest"];
export type ToolManifest = RunBundle["tool_manifest"];
export type PolicyRecord = RunBundle["policy"];
export type PolicyInput = PolicyRecord["input"];
export type PolicyDecision = PolicyRecord["decision"];
export type RunEvent = RunBundle["events"][number];
export type RunStartedEvent = Extract<RunEvent, { type: "run_started" }>;
export type IdentityAssessedEvent = Extract<
  RunEvent,
  { type: "identity_assessed" }
>;
export type PolicyEvaluatedEvent = Extract<
  RunEvent,
  { type: "policy_evaluated" }
>;
export type ToolStartedEvent = Extract<RunEvent, { type: "tool_started" }>;
export type ToolCompletedEvent = Extract<RunEvent, { type: "tool_completed" }>;
export type RunCompletedEvent = Extract<RunEvent, { type: "run_completed" }>;
export type RunDeniedEvent = Extract<RunEvent, { type: "run_denied" }>;
export type RunEvidence = RunBundle["evidence"];
export type EventEvidence = RunEvidence["events"][number];
export type Trace = NonNullable<RunBundle["trace"]>;
export type ProviderResult = NonNullable<RunBundle["provider_result"]>;
export type DeterministicAssertionResult = RunBundle["assertions"][number];
export type ReplayManifestEntry = ReplayManifest["entries"][number];

export interface ContractValidationIssue {
  readonly instancePath: string;
  readonly message: string;
}

export type ContractValidationResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly issues: readonly ContractValidationIssue[];
    };
