# Acceptance criteria

Status: **Binding**

These criteria distinguish tonight's vertical slice from later architecture
completion. A task is not complete because files exist; the observable behavior
and checks below must pass.

## 1. Tonight's terminal state

Tonight stops when this end-to-end path works. First-release hardening in
section 2 may continue afterward and does not expand tonight's critical path.

- [ ] A fresh clone installs with pinned Node/pnpm/OPA tooling and builds with
      no `.env`, backend, database, browser credential, or Groq key.
- [ ] A plain static server directly loads physical `/`, `/resume/`,
      `/lab/replay/`, and `/404.html` routes at root paths.
- [ ] Home facts come through typed `cv.yaml` paths, and `/resume/` renders every
      publishable source leaf exactly without modifying the source.
- [ ] One visibly synthetic scenario has only `read-allowed` and
      `adjust-denied` variants.
- [ ] Pinned OPA evaluates the checked-in Rego: the read is allowed and reaches
      one in-memory synthetic tool; the adjustment is denied and has no
      tool-execution event.
- [ ] Both deterministic bundles validate against `RunBundle`; the manifest
      records and the browser verifies each exact bundle's byte length and
      SHA-256 digest before parsing.
- [ ] `/lab/replay/` works with static files only, lists ordered events, and
      exposes the recorded policy input/decision without implying Live
      execution.
- [ ] The browser verifies one Merkle inclusion proof, shows the same-origin
      limitation beside it, and a labelled in-memory mutation makes it fail.
- [ ] Focused tests cover CV leaf coverage, Rego allow/deny, denied-without-tool,
      event order, and Merkle tampering without network access.
- [ ] One Playwright smoke flow loads the built static routes, exercises both
      variants and tamper failure, and permits only the local static origin.
- [ ] The shell has semantic landmarks, visible focus, keyboard-operable Replay,
      text-plus-shape states, and no serious/critical automated accessibility
      violation on the three product routes.
- [ ] The Pages artifact contains `.nojekyll`, no repository-name base path, no
      server code or secret-shaped value, and the workflow never deploys a pull
      request.

Anything not listed above is not required to call the night successful.

## 2. First-release hardening gates

### Toolchain and reproducibility

- [ ] A fresh clone installs with the pinned Node.js LTS toolchain and
      `pnpm install --frozen-lockfile`.
- [ ] `pnpm check` runs formatting, linting, type checking, CV validation,
      provenance checks, JSON Schema validation, policy tests, unit tests, and
      generated-artifact drift checks.
- [ ] Normal install/build/test commands require no `.env`, backend, database,
      browser credential, or Groq key.
- [ ] Running replay generation twice from the same checkout produces identical
      committed JSON bytes.
- [ ] An unexpected network request fails the relevant unit, integration, or
      browser test.

### Static output and routes

- [ ] `pnpm build` produces one static directory containing only HTML, CSS,
      browser JavaScript, static JSON, images/icons if any, and `.nojekyll`.
- [ ] The output contains physical files for `/`, `/resume/`,
      `/lab/replay/`, and `/404.html`.
- [ ] A plain static server can directly load every route without a rewrite or
      SPA fallback.
- [ ] No generated URL contains a repository-name base path; all site
      navigation works from `https://diegoaleyvag.github.io/`.
- [ ] The build succeeds when the optional runtime origin is unset.
- [ ] The final artifact contains no runtime source, server dependency,
      environment file, API key, secret-shaped client variable, or Groq
      authorization value.

### Portfolio and résumé factual integrity

- [ ] The home identity, summary, selected experience/projects, and contact
      links are obtained through typed `cv.yaml` source paths.
- [ ] Rendered factual text equals its canonical source value exactly; no
      shortened or paraphrased fact appears.
- [ ] `/resume/` renders every publishable `cv.yaml` leaf exactly once in an
      appropriate semantic location, except that URL label and URL may be
      represented together by one anchor.
- [ ] Unknown or missing CV fields fail the build.
- [ ] A generated provenance manifest records route, source path, source-value
      digest, rendered-value digest, and source-file digest.
- [ ] No committed snapshot duplicates canonical contact or résumé text.
- [ ] No CV value appears in scenario, replay, policy, trace, telemetry, or
      synthetic test-fixture directories.
- [ ] The source file is byte-identical before and after every build/test task.
- [ ] Public deployment remains gated on the repository owner's explicit
      confirmation of the canonical email, location, and profile links through
      reviewed `content/publication-consent.yaml`; the Pages job accepts no
      environment or workflow-input bypass.

### Synthetic scenario

- [ ] Exactly one first-slice scenario,
      `synthetic-maintenance-v1`, is offered.
- [ ] It is visibly labelled “Synthetic scenario” in the selector, run heading,
      raw view, and `RunBundle` metadata.
- [ ] The route states that the lab is a new clean-room project and links each
      implemented governance primitive to its public-source ledger entry.
- [ ] It has exactly two initial variants: `read-allowed` and
      `adjust-denied`.
- [ ] Identifiers, organizations, people, assets, credentials, arguments,
      outputs, and timestamps are fictional or clearly synthetic; domain-shaped
      values use a reserved invalid/example domain.
- [ ] Replay accepts no text field, upload, URL, arbitrary JSON, or visitor data.

### Real policy behavior

- [ ] A checked-in Rego policy and table-driven `opa test` cases define the
      required capability rule.
- [ ] The replay builder obtains both embedded decisions from a pinned OPA
      evaluation; decisions are not hand-written UI constants.
- [ ] `read-allowed` produces `allow` for `fixture:read`, then a tool-start and
      tool-complete event against in-memory synthetic state.
- [ ] `adjust-denied` produces `deny` for `fixture:adjust` because the agent
      lacks that capability.
- [ ] The denied bundle contains no tool-start, tool-complete, or tool-result
      event.
- [ ] Missing, malformed, unknown, or schema-invalid policy output fails closed
      and prevents bundle generation.

### `RunBundle` and Replay

- [ ] Both variants validate against the versioned `RunBundle` JSON Schema.
- [ ] Every bundle includes `synthetic: true`, schema/scenario versions,
      deterministic IDs, logical timestamps, ordered sequence numbers, policy
      input/output/digest, events, evidence, and generator metadata.
- [ ] The manifest records each bundle's path, versions, variant, exact byte
      length, and SHA-256 digest; the browser verifies both before parsing and
      fails closed on mismatch.
- [ ] Refreshing or directly loading `/lab/replay/` from a plain static host
      works with no backend/runtime and performs no external or Groq request.
- [ ] A keyboard user can select each variant, move through events, open policy
      details, inspect raw JSON, and return to the scenario summary.
- [ ] Static pre-hydration HTML explains Replay, identifies the synthetic
      scenario, and summarizes both outcomes.
- [ ] Replay never uses fake typing, simulated network delay, or language that
      implies current/live execution.

### Merkle integrity demonstration

- [ ] Event bytes are canonicalized with RFC 8785 and hashed with the documented
      RFC 6962-style leaf/node domain separation.
- [ ] The browser recomputes a selected event's inclusion proof and reports:
      “Integrity check passed: this event matches the Merkle root included in
      this replay bundle.”
- [ ] The same view displays the same-origin trust limitation adjacent to the
      result.
- [ ] A labelled “Tamper with an in-memory copy” action changes only a browser
      copy and makes the check fail.
- [ ] Unit tests independently mutate an event body, sibling hash, sequence
      number, and root; each mutation fails.
- [ ] The UI never uses “authentic,” “immutable,” “trustless,” “verified
      résumé,” or “compliance proved.”

### Design and accessibility

- [ ] The interface follows the Editorial Evidence Ledger tokens and layout;
      no alternate theme or generic component-library skin ships.
- [ ] There is no gradient, glass/blur panel, glow, particle field, fake
      terminal, stock AI iconography, generated portrait, decorative metric, or
      autoplay animation.
- [ ] Home and résumé ship no client framework JavaScript.
- [ ] Pages have a skip link, landmarks, one logical heading hierarchy, visible
      focus, and native controls.
- [ ] Allow, deny, selected, and integrity-failure states are understandable
      without color.
- [ ] Replay is fully keyboard operable and remains understandable at 400%
      zoom and narrow mobile width.
- [ ] `prefers-reduced-motion` removes nonessential transitions.
- [ ] Automated WCAG 2.2 AA checks report no serious/critical violations on all
      required routes.
- [ ] Manual keyboard, focus-order, zoom, reduced-motion, and print-preview
      checks are recorded in the pull request.

### Browser and deployment checks

- [ ] Playwright serves the built directory as a plain static host and directly
      visits all required routes.
- [ ] One E2E flow selects `read-allowed`, observes tool completion, verifies
      inclusion, tampers with the copy, and observes failure.
- [ ] One E2E flow selects `adjust-denied` and proves no tool execution row is
      present.
- [ ] The E2E network allowlist permits only the local static origin.
- [ ] The Pages workflow runs deterministic checks before uploading exactly the
      static output directory.
- [ ] Pull requests do not deploy; reviewed merges to `main` may deploy with
      least-privilege Pages permissions.

## 3. Explicitly not required tonight

- Public or local Fastify runtime implementation.
- Any Groq request, key, model selection, or manual Live diagnostic.
- Fake/Replay/Live provider implementation beyond the contracts needed to keep
  the future seam stable.
- VC signing or verification, approval workflow, remote DID resolution, or
  broad DID/VC profile support.
- Rego WebAssembly compilation or native/WASM parity.
- OpenTelemetry trace generation or exporter integration.
- PDF generation or a placeholder PDF link.
- Work-detail pages, run permalinks, a gallery, analytics, CMS, accounts,
  persistence, external tools, or arbitrary prompts.

Deferring these items is acceptance, not an incomplete slice.

## 4. Post-slice architecture acceptance

### Domain and contracts

- [ ] Governance state transitions reject tool execution before identity and
      policy gates.
- [ ] Approval binds exact agent, tool, argument digest, policy digest, action,
      expiry, and nonce; mismatch, expiry, and replay deny.
- [ ] A narrow synthetic DID/VC profile verifies supported `did:key` or
      bundle-embedded `did:web` material and Ed25519 credentials with a fixed
      clock; unsupported suites, remote resolution, invalid signatures, and
      validity failures deny.
- [ ] Fake and Replay pass one provider conformance suite without network.
- [ ] Normalized provider failures cover invalid request, timeout,
      cancellation, rate limit, unavailable, malformed response, and internal
      error.
- [ ] Telemetry accepts only documented bounded attributes and rejects prompt,
      output, credential, tool payload, CV content, and secret fields.

### Rego runtime

- [ ] The pinned OPA tool reproducibly compiles source policy to digest-addressed
      WebAssembly.
- [ ] Native OPA and in-process WASM produce equivalent decisions for every
      policy fixture.
- [ ] The runtime has no OPA sidecar and no user-supplied policy.
- [ ] Malformed policy output aborts replay generation at build time; at runtime
      it becomes a terminal deny/error event and no tool starts.

### Optional runtime

- [ ] The Fastify container is independently buildable and removable without
      changing the site build.
- [ ] Provider selection at the composition root is configuration-only and
      supports exactly Fake, Replay, and Live-Groq.
- [ ] Runtime composition defaults to Fake; Live fails closed unless
      `LLM_PROVIDER=live`, `LIVE_EXECUTION_ENABLED=true`, and the server key are
      all present.
- [ ] Live accepts only `schema_version`, known `scenario_id`, and finite
      `variant`; additional fields fail.
- [ ] The Groq key is server-environment-only and never appears in a response,
      event, trace, error, source map, or log.
- [ ] Groq rate-limit/retry values are parsed from response headers; missing
      values stay unknown and no provider limit is hardcoded.
- [ ] HTTP transport fixtures cover success, malformed payload, timeout,
      cancellation, `429`, and `5xx` without contacting Groq.
- [ ] Live stays disabled until a separate threat review and enablement ADR
      approve kill switch, budgets, concurrency, throttling, spend cap, alerts,
      and operator procedure.
- [ ] Deployment verification proves runtime egress is restricted to the
      configured Groq endpoint and an explicitly approved telemetry endpoint.
- [ ] The container runs as a non-root user with a read-only filesystem except
      for an explicitly bounded temporary directory and persists no run data.
- [ ] Any real-provider diagnostic is manually invoked, labelled operational,
      and excluded from all tests, evaluations, merge gates, and fixture-update
      commands.

### Optional browser Live integration

- [ ] With no runtime origin, the site renders Replay only and makes no Live
      request.
- [ ] With a runtime origin, a separate Live control discovers finite
      capabilities and submits only the closed scenario request.
- [ ] Runtime unavailability or a rejected request is contained to that control;
      Replay, résumé, and navigation remain fully functional.
- [ ] No key, arbitrary input, model selector, provider selector, file, URL, or
      open parameter object exists in the browser UI.

### Optional PDF

- [ ] A future PDF renderer reads the unchanged `cv.yaml` directly.
- [ ] It records the same source digest and passes a field-coverage check.
- [ ] HTML remains the canonical web résumé.
- [ ] A failed or stale PDF build removes the PDF link rather than serving an
      old or placeholder artifact.

## 5. Definition of done

A lane is done only when its acceptance checks pass, its generated artifacts are
current, its owned files alone were changed, and no live network or secret was
required. The integration owner records the exact commands and manual checks in
the implementation pull request.
