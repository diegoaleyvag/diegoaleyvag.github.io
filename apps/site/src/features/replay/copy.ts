/**
 * Reviewed allowlist of neutral interface copy for the Replay lab. Sentences
 * marked "verbatim" are pre-approved product copy from
 * docs/portfolio-narrative.md (section 3) or the exact evidence-language
 * required by docs/architecture.md (section 7). Nothing here is a CV fact;
 * factual portfolio text never appears in this feature.
 */
import type { DecisionEffect, EventType, VariantId } from "./types";

export const LAB_COPY = {
  documentTitle: "Synthetic replay lab",
  metaDescription:
    "Inspect two synthetic, checked-in governed runs and their Merkle evidence with no backend.",
  pageHeading: "Synthetic replay lab",
  // Verbatim product copy, docs/portfolio-narrative.md section 3.
  introA:
    "A synthetic, clean-room portfolio demonstration built from public specifications.",
  introB:
    "Replay uses checked-in synthetic runs and works without a backend. It shows recorded policy decisions and demonstrates event tamper detection relative to each bundle's included Merkle root.",
  cleanRoomHeading: "Clean-room declaration",
  cleanRoomDeclaration:
    "This lab is a new, synthetic clean-room project, not an employer deliverable and not proof of a résumé claim. It reimplements three public specifications for this scenario:",
  publicSourcesHeading: "Public sources",
  scenarioHeading: "Scenario",
  scenarioIntro:
    "The lab offers exactly one synthetic scenario, labelled \u201cSynthetic scenario\u201d throughout: synthetic-maintenance-v1. It has two finite variants.",
  readAllowedLabel: "read-allowed",
  readAllowedSummary:
    "The synthetic maintenance agent requests a read-only fixture lookup with the fixture:read capability it holds. Policy allows the action, and the in-memory tool starts and completes.",
  adjustDeniedLabel: "adjust-denied",
  adjustDeniedSummary:
    "The same synthetic agent requests a fixture adjustment with fixture:adjust, a capability it does not hold. Policy denies the action, and no tool executes.",
  evidenceLimitHeading: "What the evidence shows",
  evidenceLimitOrientation:
    "Replay recomputes a selected event's inclusion proof against the Merkle root recorded in its bundle. A match demonstrates tamper detection relative to that root. Because the bundle and root are served from the same origin, it does not prove the event is true, policy-compliant, independently witnessed, or immune to origin compromise.",
  explorerHeading: "Interactive explorer",
  noscriptMessage:
    "This interactive explorer needs JavaScript. The scenario and both outcomes are described above without it.",
  variantPickerLegend: "Choose a synthetic run to inspect",
  manifestLoadingMessage: "Loading the replay manifest…",
  manifestErrorMessage:
    "The replay manifest could not be loaded or failed its integrity check, so no run data is shown.",
  bundleLoadingMessage: "Loading the selected run…",
  bundleErrorMessagePrefix:
    "This run bundle failed an integrity check and was not rendered:",
  eventLedgerHeading: "Recorded events",
  outcomeAllowedLabel: "Allowed",
  outcomeDeniedLabel: "Denied",
  noToolExecutionNote:
    "This run has no tool-start or tool-complete event: policy denied the action before any tool executed.",
  policyHeading: "Policy decision",
  policySourceLabel: "Policy source",
  policyEntrypointLabel: "Entrypoint",
  policyRuleLabel: "Rule",
  policyReasonLabel: "Reason",
  policyInputHeading: "Recorded policy input",
  rawPolicyJsonSummary: "Raw policy record JSON",
  eventDetailsHeading: "Event detail",
  closeDetailsLabel: "Close detail",
  rawEventJsonSummary: "Raw event JSON",
  evidenceHeading: "Merkle evidence",
  evidenceCanonicalizationLabel: "Canonicalization",
  evidenceHashAlgorithmLabel: "Hash algorithm",
  evidenceMerkleLabel: "Merkle construction",
  evidenceTreeSizeLabel: "Tree size",
  evidenceRootLabel: "Included root",
  evidenceLeafLabel: "Event leaf digest",
  integrityCheckingMessage: "Checking the inclusion proof…",
  // Verbatim, docs/architecture.md section 7 and
  // docs/acceptance-criteria.md "Merkle integrity demonstration".
  integrityPassMessage:
    "Integrity check passed: this event matches the Merkle root included in this replay bundle.",
  integrityFailMessage:
    "Integrity check failed: this event does not match the Merkle root included in this replay bundle.",
  // Verbatim qualification, docs/architecture.md section 7.
  evidenceLimitQualifier:
    "This demonstrates tamper detection relative to the included root. Because the bundle and root are served by the same origin, it does not prove the event is true, policy-compliant, independently witnessed, or immune to origin compromise.",
  tamperHeading: "In-memory tamper demonstration",
  tamperDescription:
    "This changes only a copy of the selected event held in your browser's memory. It never modifies the checked-in replay bundle.",
  tamperButtonLabel: "Tamper with an in-memory copy",
  tamperCheckingMessage: "Re-checking the tampered copy…",
  tamperFailedAsExpectedMessage:
    "Tamper check result: the modified copy no longer matches the Merkle root included in this replay bundle. Tampering is detected.",
  tamperUnexpectedlyPassedMessage:
    "Unexpected: the tampered copy still matched the included root. This indicates a bug in the demonstration, not a real integrity problem.",
  merkleTreeBuildingMessage: "Reconstructing the Merkle tree…",
  merkleTreeFigureLabel: "Fig. 1",
  merkleTreeCaptionDefault:
    "This run's recorded events combine bottom-up into one Merkle root.",
  merkleTreeCaptionSelected:
    "The highlighted path shows this event's inclusion proof up to the root.",
  merkleTreeCaptionTampered:
    "Recomputed with the tampered copy: every node on the highlighted path now differs, and the root no longer matches the recorded one.",
  merkleTreeRootLabel: "Root",
  merkleTreeLegendPath: "On the selected event's path",
  merkleTreeLegendSibling: "Sibling hash the proof recombines with",
  merkleTreeLegendTamper: "Changed by the in-memory tamper",
  merkleTreeRecordedRootLabel: "Recorded root",
  merkleTreeRecomputedRootLabel: "Recomputed root (tampered copy)",
  merkleTreeRootMismatchLabel: "Root mismatch",
  playRunLabel: "Play run",
  pauseRunLabel: "Pause",
  playingStatusLabel: "Playing",
  playbackStepLabel: "Step",
  playbackOfLabel: "of",
} as const;

export const PUBLIC_SOURCES = [
  {
    id: "opa-rego",
    title: "Open Policy Agent policy language",
    url: "https://www.openpolicyagent.org/docs/policy-language",
    role: "capability policy evaluation",
  },
  {
    id: "rfc-8785",
    title: "RFC 8785 \u2014 JSON Canonicalization Scheme",
    url: "https://www.rfc-editor.org/rfc/rfc8785",
    role: "event canonicalization before hashing",
  },
  {
    id: "rfc-6962",
    title: "RFC 6962 \u2014 Certificate Transparency",
    url: "https://www.rfc-editor.org/rfc/rfc6962",
    role: "Merkle leaf/node domain separation and inclusion proofs",
  },
] as const;

export const VARIANT_SUMMARY: Record<
  VariantId,
  { readonly label: string; readonly summary: string }
> = {
  "read-allowed": {
    label: LAB_COPY.readAllowedLabel,
    summary: LAB_COPY.readAllowedSummary,
  },
  "adjust-denied": {
    label: LAB_COPY.adjustDeniedLabel,
    summary: LAB_COPY.adjustDeniedSummary,
  },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  run_started: "Run started",
  identity_assessed: "Identity assessed",
  policy_evaluated: "Policy evaluated",
  tool_started: "Tool started",
  tool_completed: "Tool completed",
  run_completed: "Run completed",
  run_denied: "Run denied",
};

export const DECISION_LABELS: Record<DecisionEffect, string> = {
  allow: "Allow",
  deny: "Deny",
  needs_approval: "Needs approval",
};

export const DECISION_MARKS: Record<DecisionEffect, string> = {
  allow: "\u25CF",
  deny: "\u25B2",
  needs_approval: "\u25C6",
};

export const INTEGRITY_MARKS = {
  checking: "\u2026",
  pass: "\u25C6",
  fail: "\u2715",
} as const;
