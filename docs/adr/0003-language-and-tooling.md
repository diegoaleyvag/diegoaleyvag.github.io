# ADR 0003: Use a TypeScript pnpm workspace

- Status: Accepted
- Date: 2026-08-01

## Context

The site, browser verifier, contracts, replay builder, governance domain, and
optional runtime share the same core data model. A TypeScript/Python split could
demonstrate another CV-listed language, but it would add two package managers,
generated cross-language types, duplicate validation, more CI setup, and a
larger maintenance burden for a solo-owned portfolio.

Modern tooling is required where justified. The repository must explicitly
decide whether `uv`, a task runner, or a build-graph tool is warranted.

## Decision

- Use TypeScript across site, tools, governance packages, providers, and the
  optional Fastify runtime.
- Use a pinned maintained Node.js LTS release.
- Use pnpm through Corepack for workspace dependency management.
- Commit one frozen `pnpm-lock.yaml`.
- Use ESLint flat configuration for TypeScript/Astro correctness rules,
  Prettier for its supported authored web/docs formats, and `opa fmt` for Rego.
- Use root package scripts as stable task entry points.
- Do not add Python, `uv`, `just`, Make, Turbo, Nx, or another task/build graph
  tool initially.
- Only the integration owner edits package manifests and the lockfile.

`uv` is deliberately not adopted because there is no Python application. If a
future concrete requirement justifies Python, a superseding ADR must define
why TypeScript is insufficient; that Python work must then use `uv` rather than
ad hoc virtual-environment or dependency commands.

The future optional PDF path may use a pinned Typst binary. That does not add a
Python package ecosystem.

## Consequences

- One type system and package manager cover every initial module.
- Browser and server code can share contract types while import rules preserve
  the secret boundary.
- The architecture does not claim language choice itself proves CV skill.
  Credibility comes from the domain model, tests, and inspectable behavior.
- Cross-language compatibility is tested at the JSON Schema boundary through
  ordinary validators, not by maintaining a second implementation solely for a
  test.
- A build-graph tool may be reconsidered only after measured workspace build
  time demonstrates a need.
