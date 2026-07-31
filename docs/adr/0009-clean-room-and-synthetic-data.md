# ADR 0009: Enforce clean-room provenance and synthetic demo data

- Status: Accepted
- Date: 2026-08-01

## Context

The CV names public governance concepts in an employer experience entry. The
portfolio lab must demonstrate those concepts without reusing, paraphrasing, or
inferring proprietary employer code, architecture, documents, naming, data, or
workflows. It must also prevent real PII, patient data, or third-party data from
entering examples, demos, tools, traces, or tests.

The canonical CV itself contains contact and location facts intended for the
portfolio, creating a necessary boundary between source-grounded public content
and synthetic demonstration data.

## Decision

- Maintain `content/public-sources/` as a ledger for each implemented public
  concept: W3C DID/VC specifications, OPA/Rego documentation, OpenTelemetry
  documentation, RFC 8785, and the selected public Merkle construction.
- Implement from those public sources and a fresh domain model only.
- Never use employer artifacts or infer an employer architecture. If provenance
  is uncertain, omit the feature.
- Prohibit employer names and CV values in package, scenario, policy, fixture,
  synthetic identity, tool, trace, or test identifiers/data.
- Require `synthetic: true`, conspicuous UI labels, fictional identifiers, and
  reserved example/invalid domains in demo artifacts.
- Replay accepts no user data. Live, if enabled, accepts only finite identifiers
  and reconstructs all data server-side.
- Public-demo tools operate only on in-memory synthetic fixtures and have no
  real external side effect.
- Render existing CV contact/location values only from `cv.yaml` on portfolio
  and résumé routes. Local builds may render them; public deployment requires
  owner confirmation. Do not duplicate them elsewhere.

## Consequences

- The lab is a new public portfolio project, not a representation of an
  employer system.
- Review requires evidence of public provenance, not merely a developer's
  recollection.
- General prompt boxes, uploads, URL inputs, remote DID resolution, real tools,
  and copied CV fixtures are out of scope.
- The content boundary can be tested by scanning demo artifacts for canonical
  CV values without storing a second copy.
