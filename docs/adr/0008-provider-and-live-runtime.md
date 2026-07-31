# ADR 0008: Keep Live optional, finite, and server-only

- Status: Accepted
- Date: 2026-08-01

## Context

Replay is the complete public experience. Fresh inference is the only capability
that requires a secret-bearing server. An open prompt or arbitrary parameters
would permit real-data submission, prompt injection, uncontrolled spend, and a
general LLM-proxy surface.

The runtime must still satisfy the repository invariant of exactly three
provider implementations with configuration-only selection.

## Decision

Use one provider port with exactly:

- Fake: deterministic and network-free;
- Replay: stored, schema-validated normalized results and network-free;
- Live: a server-only Groq adapter using the OpenAI-compatible API.

Use one stateless TypeScript Fastify service as the optional runtime composition
root. It has no database and is packaged as one portable OCI image.

The public API accepts only an exact schema containing `schema_version`, a known
`scenario_id`, and a finite `variant`. It accepts no free text, open object,
file, URL, model, provider, tool definition, or browser credential. The server
constructs all synthetic inputs.

The run endpoint returns one complete `RunBundle`. There is no streaming,
stored-run lookup, continuation token, session, or persistent history.

Provider selection is server configuration only. The Live adapter reads Groq
rate-limit and retry observations from response headers at runtime; absent or
malformed values remain unknown. No provider limit is hardcoded and raw headers
are not returned.

Public Live is not part of the first release. Enabling it requires a separate
ADR after security review of kill switch, body/output/time/concurrency limits,
source throttling, request budget, spend cap, alerts, exact origins, and
rollback. CORS is not considered authentication or abuse prevention.

HTTP transport fixtures test the Live adapter. A real Groq call may exist only
as a manually invoked operational diagnostic outside tests, CI gates,
evaluations, and golden updates.

## Consequences

- Removing the runtime or its public origin leaves every static route and
  Replay behavior intact.
- Browser code never has an API key or visitor-supplied key path.
- The finite API is intentionally not a general chatbot.
- Live denial is a governed run outcome, not necessarily an HTTP authorization
  error.
- Anonymous Live retains cost-abuse risk; the default answer is to keep it off
  until that risk is explicitly accepted.
