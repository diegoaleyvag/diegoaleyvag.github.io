# ADR 0005: Generate the web résumé directly from read-only YAML

- Status: Accepted
- Date: 2026-08-01

## Context

`content/source/cv.yaml` is the only canonical source for personal facts. The
portfolio needs abbreviated factual views and a complete accessible résumé
without allowing copied prose, silent omissions, normalized dates, or invented
case-study narrative.

The current repository contains no PDF compiler. Proposal references to an
existing compiler cannot be treated as an implementation fact.

## Decision

- Treat `cv.yaml` as read-only input.
- Validate it with a strict schema that rejects missing and unknown fields.
- Preserve source order and exact UTF-8 values.
- Expose facts to UI code through typed source paths rather than arbitrary
  strings.
- Generate semantic HTML directly with Astro; never convert a PDF to HTML or
  embed a PDF as the résumé experience.
- Generate a source digest and route/source-path provenance manifest.
- Require exact-value assertions for every factual render and complete
  publishable-leaf coverage on `/resume/`.
- Permit selection and sequencing, but not shortening or paraphrase, in the
  first release.
- Keep neutral interface copy in a separately reviewed allowlist.
- Do not use an LLM to write production factual copy.

HTML is the canonical web résumé. A future Typst PDF may be added as a secondary
download only if it reads the same YAML, records the same source digest, passes
field coverage, and is omitted when stale or failed. No placeholder PDF ships.

Canonical contact/location fields may appear only on portfolio/résumé routes.
Local builds may render them; public deployment requires owner confirmation.
They may not be copied into fixtures, telemetry, logs, analytics, or snapshots.

## Consequences

- Factual drift becomes a build failure rather than a review convention.
- Abbreviated pages may contain fewer facts but cannot rewrite them.
- HTML and a future PDF can differ visually; content parity, not pixel parity,
  is required.
- Date strings remain source strings. Machine-readable dates are added only
  when the source is unambiguous without invention.
- Adding richer case studies requires a new owner-approved canonical content
  source and its own provenance contract.
