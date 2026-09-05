# Threat model

Status: **Canonical**

[ADR 0014](adr/0014-portfolio-product-reset.md) reset the product surface
this model protects. Sections tied to the retired RunBundle/Replay/Merkle
demo are removed here rather than adapted — see
`docs/architecture.md` section 8 for what that surface was. Sections that
still matter (secrets, cost exhaustion/DoS against `/api/ask`, prompt
injection against the Ask Diego corpus, and arbitrary/real visitor data
submission) are kept and adapted below.

## Scope

This model covers:

- repository source and generated artifacts (decision manifests, the
  decisions-registry lock file, `cv:sync` output);
- the Vercel deployment: prerendered static output plus its one serverless
  function, `/api/ask`;
- the untrusted browser running the map and Ask Diego Preact islands;
- the optional Ask Diego provider boundary, selected through
  `GROQ_MODEL`/`GROQ_API_KEY` and gated to Vercel Preview deployments only;
- the closed, synthetic-or-approved-source Ask Diego corpus.

The first release may ship with no Ask Diego provider configured at all.
Ask-Diego threats remain documented because the architecture reserves that
seam, but they are not accepted merely by merging endpoint code.

## Security objectives

1. No secret reaches source control, the static artifact, browser memory,
   client configuration, a response payload, or a log.
2. `content/source/cv.yaml` remains the sole factual source and is never
   modified by a build, agent, or `cv:sync` run; the fact/narrative boundary
   in `AGENTS.md` governs everything built on top of it.
3. Demo, fixture, and corpus data is synthetic or drawn only from approved
   sources; the site never stores or logs real visitor-submitted content.
4. `/api/ask` fails closed on missing configuration, oversized input, or
   malformed output rather than guessing.
5. The static portfolio, Five Decisions collection, and résumé companion
   remain available when `/api/ask` is absent, disabled, or failing.
6. Evidence language never claims more than a project's recorded status
   supports.
7. Clean-room implementation is traceable to public sources and contains no
   employer-derived design, code, naming, or fixtures.

## Protected assets

- The optional Ask Diego provider credential (if configured) and any future
  server credential.
- `/api/ask` spend, quota, and availability.
- The closed Ask Diego corpus and its citation integrity — an answer must
  not cite content the corpus doesn't contain.
- Correctness of project/decision manifests and their validated status
  field.
- Factual integrity of the résumé companion and portfolio content.
- Diego's reputation and visitors' understanding of what a
  `planned`/`building` status means.
- Public-source provenance and clean-room status.
- CI credentials and deployment permissions.

CV contact and location values are public-content candidates, not demo
data. They still must not be copied into telemetry, fixtures, logs, or test
snapshots.

## Threat actors and assumptions

- An anonymous visitor may alter browser state, requests, or submit any text
  to `/api/ask`.
- A script may call `/api/ask` directly without using the site UI.
- Model output, when a provider is configured, is untrusted even though the
  retrieved context is server-authored.
- A dependency, CI action, or pull request may be malicious or compromised.
- CORS does not authenticate a caller or prevent non-browser abuse.

## Trust boundaries

1. **Contributor to reviewed repository:** proposed files cross into trusted
   source only after review and deterministic checks.
2. **Repository to CI:** lockfiles, actions, and generation/validation tools
   execute with narrowly scoped permissions.
3. **CI to deployed artifact:** only the built site and its one function are
   deployed; no other server code or environment file ships.
4. **Deployed origin to browser:** all static content is public and
   potentially attacker-controlled from the browser's perspective.
5. **Browser to `/api/ask`:** every request is untrusted regardless of
   origin.
6. **`/api/ask` to the optional provider:** the question, bounded prior
   messages, and retrieved fragments leave the trusted server; the response
   returns as untrusted input.
7. **Provider output to the visitor:** a model-proposed answer is data,
   never authority; length, citation-membership, and content checks run
   before it renders.
8. **Public specification to clean-room implementation:** only documented
   public concepts cross this boundary, with a source-ledger entry.

## Threats and controls

### Secret disclosure

Threats include a committed `.env`, a client-exposed environment variable, a
browser-direct provider call, a source map, a stack trace, an
authorization-header log, an upstream error body, or a runtime configuration
endpoint.

Controls:

- The Ask Diego provider credential, if configured, exists only in
  server-side (Vercel) environment variables.
- `.gitignore` covers local environment variants; `.env.example` contains
  empty placeholders only.
- Browser-reachable code cannot import server-only Ask-Diego modules or
  runtime configuration.
- The static build and normal tests run without secrets.
- CI scans source, generated JavaScript/JSON, source maps, and the final
  artifact for secret names and credential patterns.
- Logs redact authorization headers, upstream bodies, prompts, and outputs.
- `/api/ask` returns a generic message and correlation ID on failure.
- `/api/ask` fails closed if a provider is selected without its key.

Residual risk: a compromised deployment can read its process environment.
Use the platform secret store, least privilege, rotation, and a provider
spend cap.

### Cost exhaustion and denial of service against `/api/ask`

An anonymous endpoint cannot be made safe by hiding a browser token or by
CORS alone.

Controls:

- default-off provider execution, further gated to Vercel Preview
  deployments only (C9A) — a key/model pair accidentally also saved
  against Production cannot activate the provider there; the site is
  complete without it;
- strict body size, output length, and timeout bounds on every request;
- platform (Vercel Firewall) rate-limiting where a rule is configured, plus
  an injectable per-session limiter for tests — documented in code
  (`rate-limiter.ts`) as a per-instance mitigation only, never presented as
  a global ceiling across every warm instance;
- the actual hard ceiling against runaway usage is the rate limit the
  operator configures directly on the Groq project
  (`console.groq.com/settings/limits`), kept below the account's currently
  observed free-tier quota; this repository never hardcodes that
  account-specific number, and does not rely on a payment-based spend cap
  (the Free tier the account uses has no billing method attached to cap
  spend against in the first place);
- fast rejection (oversized body, wrong content type, unknown field) before
  any provider call;
- no persistence or run-history amplification;
- graceful `402`/`429`/`503`/timeout fallback to the static FAQ rather than
  retrying against the provider.

Residual cost-abuse risk remains against any public endpoint. Operational
monitoring and the Groq project's own configured rate limit remain
required.

### Provider data retention (Groq)

The Groq API may temporarily retain inference request/response content for
up to 30 days for system reliability and abuse monitoring unless Zero Data
Retention (ZDR) is enabled on the account
(`https://console.groq.com/docs/your-data`, consulted 2026-09-04). Groq
always collects usage metadata (request counts, latency) regardless of
ZDR — ZDR controls retention of request/response content, not the fact
that Groq observes a call happened. Enabling ZDR is an operational
prerequisite the account owner completes in the Groq console's Data
Controls settings before Preview activation; this repository cannot
enforce a third party's data-retention setting in code.

Controls:

- this application logs no prompt, answer, IP address, or request header —
  only the bounded, allowlisted metric fields in `AskMetricEvent`
  (`.cursor/rules/ai-guide.mdc`);
- the call to Groq is server-to-server from `/api/ask`; Groq's API observes
  this application's server IP, never the visitor's browser IP.

### Prompt injection against the Ask Diego corpus

Unlike the retired Live seam, `/api/ask` intentionally accepts a free-text
question — the injection surface is the question field and the retrieved
context, not an open `params` object.

Controls:

- retrieval is restricted to the closed, approved-source corpus; there is no
  browsing, filesystem access, or private data source for a model to reach;
- the model has no tool, function, or side-effecting action available to
  it — it can only produce text;
- the response is validated: bounded length, and every citation must
  reference an ID actually present in the retrieved context;
- a request with no sufficient corpus match returns an explicit "don't
  know" `status` without calling a provider to guess;
- at most four prior messages plus the current question are sent — no
  unbounded conversation state a visitor could use to smuggle instructions
  across turns.

### Arbitrary or real visitor data submission

A visitor can type anything into the question field, including PII or
attempted abuse content. The system cannot prevent the keystrokes; it
controls what happens to them.

Controls:

- the question is not persisted; it is used for one retrieval-and-provider
  call and discarded;
- logs and telemetry never record the full question or answer text — only
  bounded, allowlisted identifiers (status, latency, error category);
- the corpus itself contains no real visitor data, so even a successful
  injection cannot exfiltrate anything beyond the approved public content
  already on the site;
- the static FAQ fallback never depends on visitor input at all.

### Cross-site request abuse

Controls:

- exact production and explicit local-development origin allowlists for
  `/api/ask`;
- JSON-only POST, no cookies, no browser credentials, no wildcard CORS;
- origin checks are defense in depth, not the primary abuse control — rate
  limiting and input validation are enforced server-side regardless of
  origin.

### Cross-site scripting and content injection

Controls:

- Astro escapes CV, manifest, and corpus strings by default;
- model output, citations, and raw JSON render as text nodes, never raw
  HTML;
- no raw HTML from YAML, manifests, or model output;
- URLs render only from typed, expected content fields or fixed navigation;
- no third-party scripts other than the explicitly configured provider
  call, which runs server-side and never reaches the browser.

### Factual-content fabrication or omission

Controls:

- `cv.yaml` is read-only and schema-validated; `cv:sync` output records its
  own source commit and digest;
- the fact/narrative boundary in `AGENTS.md` governs every other page: facts
  trace to `cv.yaml` or an approved `content/public-sources/` entry, and
  narrative/translation creativity never introduces a new one;
- project/decision status renders only from a validated manifest field,
  never freehand copy, and `verified` requires recorded evidence;
- build checks reject a CV value found in demo/fixture/corpus artifacts.

### Clean-room contamination

Controls:

- a public-source ledger for every implemented public concept;
- no employer names in package, manifest, fixture, or architecture
  identifiers;
- no reuse, paraphrase, or inference from employer code, diagrams, APIs,
  schemas, workflows, naming, or documents;
- reviewers ask for a public source; uncertainty is resolved by omission;
- the secondary Personal Governance Lab case is labelled as a new synthetic
  clean-room project, not an employer deliverable.

### Telemetry leakage

Controls:

- no client analytics beyond what is explicitly reviewed;
- server telemetry (if any) uses an allowlist of bounded identifiers, state,
  timing, and error categories;
- prompts, answers, credentials, contact fields, and CV content are
  prohibited telemetry attributes;
- exporters, if used, are server-only and optional.

### Supply-chain and CI compromise

Controls:

- pinned Node, pnpm, and CI action revisions;
- frozen lockfile and minimal direct dependencies;
- dependency review and vulnerability reporting;
- least-privilege workflow permissions, with deployment credentials scoped
  to the deployment job only;
- pull requests build and test but do not deploy;
- static artifact allowlist and secret scan before upload;
- no unreviewed generated executable code.

Residual risk cannot be eliminated. Dependency additions and CI permission
changes require explicit review.

### Static routing and deployment integrity

Controls:

- physical directory routes for every page except `/api/ask`, and a real
  `404.html`;
- internal-link crawl and direct-route E2E from the built output;
- an artifact check forbids a second dynamic route, a server-only import
  outside `/api/ask`, and a secret-shaped value anywhere in the bundle.

## First-release security gate

Release is blocked unless:

- the final artifact contains no secret and no server-only module outside
  `/api/ask`;
- the site works, and Ask Diego degrades gracefully, with no provider
  configured;
- all demo/fixture/corpus data is synthetic or drawn from approved sources;
- every project/decision status comes from a validated manifest, and none is
  `verified` without recorded evidence;
- `/api/ask` rejects oversized/malformed requests and falls back gracefully
  on `402`/`429`/`503`/timeout;
- direct-loaded routes, keyboard use, bilingual parity, and output escaping
  pass;
- no retired package is deleted without a fresh consumer search documented
  in the retiring commit.
