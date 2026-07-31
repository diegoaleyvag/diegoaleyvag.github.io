# Hard Constraints

Every proposal in `docs/proposals/` MUST satisfy every item below. Judges apply
the penalties in `docs/evaluation-rubric.md` to any proposal that violates them.
This checklist restates (and makes checkable) the invariants in `AGENTS.md`.

## Deployment & publication target

- [ ] The public web build is published from repository
      **`diegoaleyvag/diegoaleyvag.github.io`** as a **GitHub Pages
      user/organization root site** — served at `https://diegoaleyvag.github.io/`
      with **no basePath / no repo-name subpath**.
- [ ] No proposal assumes, hardcodes, or references any other GitHub owner/org
      name.
- [ ] The build output is a fully static bundle (HTML/CSS/JS + static assets
      only) servable by a plain static file host — no server-side rendering
      required at request time.
- [ ] Any client-side routing works correctly with static hosting and a root
      path (no server rewrites available).

## Replay mode / static-first demo

- [ ] The interactive demo has a **Replay mode** that works with **zero
      backend** — no server, no database, no API key required to load and use
      it.
- [ ] Replay data is pre-recorded, static JSON (or equivalent) checked into the
      repo or generated at build time.

## Provider-neutral live runtime (optional component)

- [ ] The live-inference runtime is independently deployable from the static
      site (it may be absent entirely without breaking the static site or
      Replay mode).
- [ ] The runtime supports exactly three interchangeable providers behind one
      interface: **Fake** (deterministic/tests), **Replay** (stored JSON runs),
      **Live** (Groq).
- [ ] The first live provider is **Groq**, using its **OpenAI-compatible** API
      surface.
- [ ] Rate limits are read from Groq's response headers at runtime — never
      hardcoded.
- [ ] Swapping providers requires no changes to caller code (configuration
      only, e.g. `LLM_PROVIDER`).

## Secrets

- [ ] No API key, token, or credential ever reaches the browser, a client
      bundle, or any client-exposed variable (e.g. `NEXT_PUBLIC_*` or
      equivalent).
- [ ] Secrets live only in local or server-side environment variables.
- [ ] `.env.example` contains placeholders only — real secrets are never
      committed.
- [ ] `.gitignore` excludes all local env files (`.env`, `.env.local`, etc.).

## Clean-room compliance

- [ ] No proposal reuses, paraphrases, or is derived from proprietary Infosys
      code, architecture, internal documentation, or confidential IP.
- [ ] Only **public** concepts are reimplemented, and only from **public**
      specifications/documentation: W3C DIDs/VCs, OPA/Rego, Merkle audit trees,
      OpenTelemetry.
- [ ] Any doubt about provenance is resolved by omission, not by inclusion.

## Synthetic data only

- [ ] All example, demo, seed, and test data is synthetic.
- [ ] No real PII, real patient data, or real third-party data appears in
      examples, demos, scenarios, fixtures, tools, traces, telemetry, analytics,
      or tests.
- [ ] The existing canonical CV is the sole personal-content source. Its fields
      may be rendered directly on portfolio/résumé routes, but must never be
      copied into demo/test data, snapshots, logs, telemetry, or analytics.
- [ ] Public deployment of canonical contact and location fields requires the
      repository owner's explicit confirmation; local validation/building does
      not.

## Tooling preference

- [ ] Modern, fast tooling is preferred where justified by the proposal (e.g.
      `uv` for Python virtual environments/dependency management, if a Python
      service is chosen).
- [ ] Every notable stack or tooling choice is recorded as an ADR in
      `docs/adr/` with a rationale.
- [ ] No choice is made purely out of habit — proposals justify
      framework/language/package-manager/database selections against the goals
      in `docs/project-context.md`.

## Git & process

- [ ] Trunk-based development with short-lived branches.
- [ ] Commit messages follow [Conventional
      Commits](https://www.conventionalcommits.org/).
- [ ] No force-push to `main`.
- [ ] Changes are reviewed before integrating.
- [ ] Commits contain **no AI co-author trailers** — Diego is the sole author
      of record.

## Factual integrity

- [ ] `content/source/cv.yaml` is treated as read-only. No proposal alters,
      "corrects," embellishes, or infers facts from it.
- [ ] No fabricated metrics, experience, integrations, or capabilities appear
      anywhere (docs, UI copy, demo content, or code comments).

## Scope discipline

- [ ] Bootstrap-phase artifacts (this commit) contain no framework, language,
      package manager, database, product name, visual design, or final repo
      architecture decisions. Those belong to the proposal phase.
