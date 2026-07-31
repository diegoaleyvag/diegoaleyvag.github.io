# ADR 0001: Select Candidate A as the synthesis base

- Status: Accepted
- Date: 2026-08-01

## Context

Three independent proposals were judged blind against the repository rubric and
hard constraints. Both judges ranked Candidate A first with a final score of
96. They agreed that A had the strongest static/live separation, governance
domain, factual safeguards, security posture, deterministic testing, and root
GitHub Pages plan. Both identified first-night scope as its material weakness.

Candidate B contributed a strong single-artifact contract, pragmatic first-slice
scope, and the editorial parallel between CV provenance and governed-run
evidence. Candidate C's useful contribution was pressure toward a smaller first
delivery, but its undecided stack, open API, and thin governance model are not
adopted.

## Decision

Use Candidate A as the architectural base.

Adopt these compatible ideas:

- one versioned `RunBundle` shared by generation, Replay, inspection, and tests;
- one small first-slice scenario with allow and deny variants;
- a deterministic retained bundle builder rather than the full runtime tonight;
- conceptual coherence between content provenance and run evidence;
- a checkable compliance and acceptance gate.

Reject these incompatible or unsafe ideas:

- arbitrary `intent`, `context`, or `params` input;
- factual qualifiers not present in `cv.yaml`;
- claims that same-origin signatures or roots remove trust in the origin;
- real-provider tests;
- a second implementation language chosen only to mirror the CV;
- mocked policy output presented as executed policy;
- multiple visual themes or Live inference in the first slice.

The binding resolutions are recorded in `docs/architecture.md`, including the
judges' overlapping hard questions on language, first-night fidelity, Rego
WASM, content provenance, browser claims, public Live, and visual direction.

## Consequences

- Implementation has one coherent authority rather than a feature-by-feature
  merge of proposals.
- Candidate documents and judgements remain historical records, not active
  implementation instructions.
- The first slice proves fewer concepts but proves them end to end.
- Any architecture deviation requires a superseding ADR and must continue to
  satisfy `AGENTS.md` and `docs/hard-constraints.md`.
