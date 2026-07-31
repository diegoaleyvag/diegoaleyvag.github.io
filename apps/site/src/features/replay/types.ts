import type { PolicyDecision, RunEvent } from "@portfolio/contracts";

export const SCENARIO_ID = "synthetic-maintenance-v1" as const;

export type VariantId = "read-allowed" | "adjust-denied";

export const VARIANT_IDS: readonly VariantId[] = [
  "read-allowed",
  "adjust-denied",
];

export type AsyncState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly value: T }
  | { readonly status: "error"; readonly message: string };

export type IntegrityStatus = "checking" | "pass" | "fail";

export interface IntegrityResultState {
  readonly status: IntegrityStatus;
}

export type TamperStatus =
  "not-run" | "checking" | "failed-as-expected" | "unexpectedly-passed";

export interface TamperResultState {
  readonly status: TamperStatus;
}

export type EventType = RunEvent["type"];
export type DecisionEffect = PolicyDecision["effect"];
