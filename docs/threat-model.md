# Threat model

Status: **Canonical**

## Scope

This model covers:

- repository source and generated artifacts;
- GitHub Actions and the GitHub Pages static deployment;
- the untrusted browser running Replay;
- the optional stateless Fastify runtime;
- the Groq OpenAI-compatible API boundary;
- deterministic synthetic fixtures, policy, traces, and audit evidence.

The first public release has no Live runtime. Live threats remain documented
because the architecture reserves that seam, but they are not accepted merely
by merging runtime code.

## Security objectives

1. No secret reaches source control, a static artifact, browser memory, client
   configuration, response payload, or log.
2. `content/source/cv.yaml` remains the sole factual source and is never
   modified by a build or agent.
3. Demo, fixture, tool, approval, trace, and test data is synthetic and cannot
   accept visitor-supplied personal data.
4. Policy decisions and event ordering fail closed when input or output is
   missing, malformed, mismatched, or out of sequence.
5. The static portfolio and Replay remain available when the runtime is absent
   or compromised.
6. Evidence language never claims more than the mechanism establishes.
7. Clean-room implementation is traceable to public sources and contains no
   employer-derived design, code, naming, or fixtures.

## Protected assets

- Groq API key and any future server credential.
- Runtime spend, quota, concurrency, and availability.
- Integrity of the deployed static artifact and checked-in replay bundles.
- Correctness of policy decisions, approval binding, event ordering, and
  deterministic evaluation.
- Factual integrity of résumé and portfolio content.
- Diego's reputation and visitors' understanding of evidence limits.
- Public-source provenance and clean-room status.
- CI credentials and GitHub Pages deployment permissions.

CV contact and location values are public-content candidates, not demo data.
They still must not be copied into telemetry, fixtures, logs, or test snapshots.

## Threat actors and assumptions

- An anonymous visitor may alter browser state, requests, or loaded JSON.
- A script may call any public runtime endpoint without using the site UI.
- Model output is untrusted even when the prompt is server-authored.
- A dependency, CI action, replay artifact, or pull request may be malicious or
  compromised.
- GitHub Pages and the browser origin are not independent trust anchors for
  artifacts served together.
- CORS does not authenticate a caller or prevent non-browser abuse.
- Hashes detect changes relative to a root; they do not establish truth,
  authorship, policy compliance, or origin integrity.

## Trust boundaries

1. **Contributor to reviewed repository:** proposed files cross into trusted
   source only after review and deterministic checks.
2. **Repository to CI:** lockfiles, actions, compilers, and generation tools
   execute with narrowly scoped permissions.
3. **CI to Pages artifact:** only the checked static output directory is
   uploaded; runtime source and environment files are excluded.
4. **Pages origin to browser:** all content is public and potentially
   attacker-controlled from the browser's perspective.
5. **Browser to optional runtime:** requests are untrusted regardless of origin.
6. **Runtime to Groq:** authorization and synthetic prompts leave the trusted
   runtime; responses and headers return as untrusted input.
7. **Model output to orchestrator/tool:** proposed tool calls are data, never
   authority; schema and policy gates run immediately before any action.
8. **Public specification to clean-room implementation:** only documented
   public concepts cross this boundary, with a source-ledger entry.

## Threats and controls

### Secret disclosure

Threats include a committed `.env`, client-exposed environment variable,
browser-direct Groq call, source map, stack trace, authorization-header log,
upstream error body, or runtime configuration endpoint.

Controls:

- Groq credentials exist only in local or server process environment variables.
- `.gitignore` covers local environment variants; `.env.example` contains empty
  placeholders only.
- `apps/site` cannot import runtime configuration or the Live adapter.
- Static build and tests run without secrets.
- CI scans source, generated JavaScript, JSON, source maps, and the final
  artifact for secret names and credential patterns.
- Logs redact authorization headers, upstream bodies, prompts, outputs, and
  environment values.
- Runtime errors return a generic message and correlation ID.
- Startup fails closed if Live is selected without its key.

Residual risk: a compromised runtime host can read its process environment.
Use the host secret store, least privilege, rotation, and a provider spend cap.

### Arbitrary or real data submission

An open prompt, `params` object, URL, upload, or context field could carry PII,
patient data, proprietary content, or prompt injection.

Controls:

- Replay accepts no visitor data.
- Live accepts only an exact schema with `schema_version`, a known
  `scenario_id`, and a finite `variant`.
- Unknown keys, oversized bodies, wrong content types, and unsupported enum
  values are rejected before orchestration.
- The server constructs prompts, credentials, tool inputs, and fixture state
  from versioned synthetic assets.
- Reserved domains and unmistakably fictional identifiers are used where
  domain-shaped data is needed.
- No request body or model content is retained.

Residual risk: even finite identifiers can be abused at volume; operational
controls are still required.

### Prompt injection, policy bypass, and tool abuse

Threats include hostile model output, unknown tool names, extra arguments,
malformed policy output, stale decisions, and attempting a tool before
authorization.

Controls:

- No public free-text prompt.
- Tool names and argument/result schemas are allowlisted and versioned.
- Model-proposed calls are parsed as untrusted data; unknown fields fail.
- Identity/capability checks and Rego evaluation occur immediately before each
  action.
- Missing or malformed policy output is deny.
- Event state-machine rules prevent tool start before an allow or correctly
  bound approval.
- Public tools operate only on bounded in-memory synthetic fixtures and have no
  external side effect.
- Time, output, and call-count limits apply to every run.

### Approval confusion and replay

This is a future-runtime threat; approvals do not ship tonight.

Controls when implemented:

- Approval binds the agent, tool, canonical argument digest, policy digest,
  action, expiry, and one-time nonce.
- Mismatch, expiry, duplicate use, changed arguments, or changed policy denies.
- Public demo approvals are synthetic scenario variants, not claims of real
  human identity.

### Arbitrary code execution, SSRF, and exfiltration

Controls:

- No shell, `eval`, generated code, plugin loading, user Rego, arbitrary
  filesystem path, URL fetch, email, database, or browser-provided DID URL.
- Runtime egress is restricted operationally to the configured Groq endpoint
  and an optional approved telemetry endpoint.
- Remote `did:web` resolution is absent from Replay and the first runtime.
- Container runs as a non-root user with a read-only filesystem where the host
  supports it.

### Cost exhaustion and denial of service

An anonymous Live endpoint cannot be made safe by hiding a browser token or by
CORS.

Controls before Live enablement:

- default-off execution kill switch;
- finite scenarios and variants;
- strict body, output, duration, tool-call, and concurrency bounds;
- host-level source throttling and configurable application request budgets;
- provider account spend cap and alerts;
- Groq rate-limit/retry observations read from response headers, never hardcoded;
- sanitized `Retry-After` when known;
- fast rejection before provider use;
- no persistence or run-history amplification.

Residual cost-abuse risk remains. A separate ADR must explicitly accept it
before public Live is enabled. Disabling Live must not affect Replay or the
portfolio.

### Cross-site request abuse

Controls:

- exact production and explicit local-development origin allowlists;
- JSON-only POST, no cookies, no browser credentials, and no wildcard CORS;
- origin checks as defense in depth;
- no state-changing real-world tool;
- all meaningful abuse controls enforced server-side independent of CORS.

### Cross-site scripting and content injection

Controls:

- Astro escapes CV and fixture strings by default.
- Model, policy reason, raw JSON, and trace values render as text nodes.
- No raw HTML from YAML, fixtures, Markdown, or model output.
- If Markdown is later introduced, raw HTML and unsafe URLs remain disabled and
  a reviewed sanitizer is mandatory.
- URLs are rendered only from typed, expected CV fields or fixed navigation.
- No third-party scripts in the first release.
- A restrictive CSP meta policy may be used within GitHub Pages' header
  limitations, but escaping and safe DOM APIs remain primary.

### Replay tampering and misleading verification

Threats include an altered event, proof, manifest, root, or UI message; a
same-origin attacker may replace all of them consistently.

Controls:

- schema validation and bundle digest checks;
- RFC 8785 canonicalization and RFC 6962-style domain-separated hashing;
- inclusion-proof recomputation in the browser;
- negative tests mutate an event, sibling, and sequence;
- generated artifacts are rebuilt and compared in CI;
- release commit/digests provide an external comparison point;
- exact qualified copy appears next to the result.

The accepted claim is only that an event matches the root included in the loaded
bundle. Same-origin verification is an integrity-mechanism demonstration, not
independent authenticity.

### Factual-content fabrication or omission

Controls:

- `cv.yaml` is read-only and schema-validated.
- Factual UI components accept typed source paths rather than authored prose.
- Rendered factual strings must exactly match source values.
- `/resume/` has complete publishable-leaf coverage.
- A route/source-path provenance manifest is generated.
- Neutral interface copy is separately reviewed.
- No production factual copy is LLM-generated.
- Build checks reject CV values found in demo artifacts.

### Clean-room contamination

Controls:

- public-source ledger for every implemented public concept;
- no employer names in package, policy, scenario, fixture, or architecture
  identifiers;
- no reuse, paraphrase, or inference from employer code, diagrams, APIs,
  schemas, workflows, naming, or documents;
- reviewers ask for a public source; uncertainty is resolved by omission;
- the lab is labelled as a new synthetic clean-room portfolio project.

### Telemetry leakage

Controls:

- no client analytics in the first release;
- server telemetry uses an allowlist of bounded identifiers, state, timing, and
  error categories;
- prompts, output, credentials, tool arguments/results, contact fields, CV
  content, headers, and secrets are prohibited attributes;
- Replay traces are synthetic inspection artifacts, not evidence that an
  external collector received them;
- exporters are server-only and optional.

### Supply-chain and CI compromise

Controls:

- pinned Node, pnpm, OPA, and CI action revisions;
- frozen lockfile and minimal direct dependencies;
- dependency review and vulnerability reporting;
- least-privilege workflow permissions, with Pages write/OIDC only in the
  deployment job;
- pull requests build but do not deploy;
- deterministic regeneration checks;
- static artifact allowlist and secret scan before upload;
- no unreviewed generated executable code.

Residual risk cannot be eliminated. Dependency additions and CI permission
changes require explicit review.

### Static routing and deployment integrity

Controls:

- physical directory routes and a real `404.html`;
- `base: "/"`, no repository-name prefix, no CNAME;
- `.nojekyll` in the uploaded root;
- internal-link crawl and direct-route E2E from a plain static server;
- artifact check forbids server code and secret-shaped configuration.

## First-release security gate

Release is blocked unless:

- the final static artifact contains no secret or server-only module;
- Replay makes no external network request;
- all demo data is visibly synthetic;
- exact CV source coverage passes without duplicate snapshots;
- allow and deny Rego cases pass;
- denied runs contain no tool-start or tool-result event;
- tampering causes integrity failure and the UI displays the trust limitation;
- direct root-hosted routes, keyboard use, and output escaping pass;
- the repository owner confirms publication of canonical contact fields.
