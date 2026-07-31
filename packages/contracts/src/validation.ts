import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { replayManifestSchema, runBundleSchema } from "./schema.ts";
import type {
  ContractValidationIssue,
  ContractValidationResult,
  ReplayManifest,
  RunBundle,
} from "./types.ts";

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});

addFormats(ajv);

const runBundleValidator = ajv.compile(runBundleSchema);
const replayManifestValidator = ajv.compile(replayManifestSchema);

function schemaIssues(
  errors: readonly ErrorObject[] | null | undefined,
): ContractValidationIssue[] {
  return (errors ?? []).map((error) => ({
    instancePath: error.instancePath || "/",
    message: error.message ?? "failed schema validation",
  }));
}

function issue(instancePath: string, message: string): ContractValidationIssue {
  return { instancePath, message };
}

function runBundleSemanticIssues(bundle: RunBundle): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = [];
  const eventIds = new Set<string>();
  let previousLogicalTime = "";

  bundle.events.forEach((event, index) => {
    const expectedSequence = index + 1;
    if (event.sequence !== expectedSequence) {
      issues.push(
        issue(
          `/events/${index}/sequence`,
          `must equal contiguous sequence ${expectedSequence}`,
        ),
      );
    }

    if (eventIds.has(event.event_id)) {
      issues.push(
        issue(`/events/${index}/event_id`, "must be unique within the run"),
      );
    }
    eventIds.add(event.event_id);

    if (
      previousLogicalTime !== "" &&
      event.logical_time < previousLogicalTime
    ) {
      issues.push(
        issue(
          `/events/${index}/logical_time`,
          "must not precede the prior logical event time",
        ),
      );
    }
    previousLogicalTime = event.logical_time;
  });

  if (bundle.events[0]?.type !== "run_started") {
    issues.push(issue("/events/0/type", "must be run_started"));
  }

  const policyEvents = bundle.events.filter(
    (event) => event.type === "policy_evaluated",
  );
  if (policyEvents.length !== 1) {
    issues.push(
      issue("/events", "must contain exactly one policy_evaluated event"),
    );
  } else {
    const [policyEvent] = policyEvents;
    if (
      policyEvent?.data.effect !== bundle.policy.decision.effect ||
      policyEvent.data.rule_id !== bundle.policy.decision.rule_id
    ) {
      issues.push(
        issue(
          "/events",
          "policy_evaluated data must match the embedded policy decision",
        ),
      );
    }
  }

  if (
    bundle.policy.input.action !== bundle.policy.decision.action ||
    bundle.policy.decision.required_capability !== bundle.policy.input.action
  ) {
    issues.push(
      issue(
        "/policy",
        "input action and decision capability binding must match",
      ),
    );
  }

  if (
    bundle.policy.input.agent.id !== bundle.agent_manifest.id ||
    bundle.policy.input.tool.id !== bundle.tool_manifest.id
  ) {
    issues.push(
      issue(
        "/policy/input",
        "policy subject identifiers must match the embedded manifests",
      ),
    );
  }

  const toolEvents = bundle.events.filter(
    (event) => event.type === "tool_started" || event.type === "tool_completed",
  );
  const terminalEvent = bundle.events.at(-1);

  if (bundle.policy.decision.effect === "allow") {
    const startedIndex = bundle.events.findIndex(
      (event) => event.type === "tool_started",
    );
    const completedIndex = bundle.events.findIndex(
      (event) => event.type === "tool_completed",
    );

    if (
      terminalEvent?.type !== "run_completed" ||
      startedIndex < 0 ||
      completedIndex <= startedIndex
    ) {
      issues.push(
        issue(
          "/events",
          "an allowed run must start and complete one tool before run_completed",
        ),
      );
    }
  } else {
    if (terminalEvent?.type !== "run_denied") {
      issues.push(
        issue(
          `/events/${Math.max(bundle.events.length - 1, 0)}/type`,
          "a non-allow decision must terminate with run_denied",
        ),
      );
    }
    if (toolEvents.length > 0) {
      issues.push(
        issue(
          "/events",
          "a non-allow decision must contain no tool execution event",
        ),
      );
    }
  }

  if (bundle.evidence.tree_size !== bundle.events.length) {
    issues.push(
      issue("/evidence/tree_size", "must equal the number of run events"),
    );
  }

  if (bundle.evidence.events.length !== bundle.events.length) {
    issues.push(
      issue(
        "/evidence/events",
        "must contain one evidence record for each run event",
      ),
    );
  }

  bundle.evidence.events.forEach((eventEvidence, index) => {
    if (eventEvidence.sequence !== index + 1) {
      issues.push(
        issue(
          `/evidence/events/${index}/sequence`,
          `must bind event sequence ${index + 1}`,
        ),
      );
    }
  });

  return issues;
}

function replayManifestSemanticIssues(
  manifest: ReplayManifest,
): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = [];
  const paths = new Set<string>();
  const variants = new Set<string>();

  manifest.entries.forEach((entry, index) => {
    const variantKey = `${entry.scenario_id}:${entry.variant}`;
    if (paths.has(entry.path)) {
      issues.push(
        issue(`/entries/${index}/path`, "must be unique in the manifest"),
      );
    }
    paths.add(entry.path);

    if (variants.has(variantKey)) {
      issues.push(
        issue(
          `/entries/${index}/variant`,
          "scenario and variant pair must be unique",
        ),
      );
    }
    variants.add(variantKey);
  });

  return issues;
}

export function validateRunBundle(
  value: unknown,
): ContractValidationResult<RunBundle> {
  if (!runBundleValidator(value)) {
    return { ok: false, issues: schemaIssues(runBundleValidator.errors) };
  }

  const bundle = value as RunBundle;
  const issues = runBundleSemanticIssues(bundle);
  return issues.length === 0
    ? { ok: true, value: bundle }
    : { ok: false, issues };
}

export function validateReplayManifest(
  value: unknown,
): ContractValidationResult<ReplayManifest> {
  if (!replayManifestValidator(value)) {
    return {
      ok: false,
      issues: schemaIssues(replayManifestValidator.errors),
    };
  }

  const manifest = value as ReplayManifest;
  const issues = replayManifestSemanticIssues(manifest);
  return issues.length === 0
    ? { ok: true, value: manifest }
    : { ok: false, issues };
}

function describeIssues(issues: readonly ContractValidationIssue[]): string {
  return issues
    .map(({ instancePath, message }) => `${instancePath}: ${message}`)
    .join("\n");
}

export function assertRunBundle(value: unknown): asserts value is RunBundle {
  const result = validateRunBundle(value);
  if (!result.ok) {
    throw new Error(`Invalid RunBundle:\n${describeIssues(result.issues)}`);
  }
}

export function assertReplayManifest(
  value: unknown,
): asserts value is ReplayManifest {
  const result = validateReplayManifest(value);
  if (!result.ok) {
    throw new Error(
      `Invalid replay manifest:\n${describeIssues(result.issues)}`,
    );
  }
}
