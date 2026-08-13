# ADR 0014: Reset the product around a bilingual Five Decisions portfolio

- Status: Accepted
- Date: 2026-08-13
- Supersedes: [ADR 0004](0004-root-github-pages-deployment.md), [ADR 0005](0005-canonical-cv-rendering.md), [ADR 0006](0006-runbundle-and-replay.md), [ADR 0007](0007-rego-execution.md), [ADR 0008](0008-provider-and-live-runtime.md), [ADR 0010](0010-merkle-evidence-semantics.md), [ADR 0013](0013-brutalist-editorial.md)

## Context

The first architecture tournament ([ADR 0001](0001-tournament-synthesis.md))
produced a single flagship product: a governed-run Replay lab demonstrating
agent-governance concepts (identity, OPA/Rego policy, Merkle audit) as the
primary evidence of engineering skill, deployed exclusively to the GitHub
Pages user-root domain, with the canonical CV mirrored onto portfolio and
résumé routes almost verbatim. A subsequent audit concluded that framing
under-serves the actual audience — recruiters and engineers evaluating a
final-year Data Science student for junior AI/ML roles, not a shipped
agent-governance vendor.

Diego spends May–August 2026 preparing for two architecture exams, with a
Professional track arriving in July, and wants that preparation to produce
inspectable, runnable code rather than only résumé prose. The reset replaces
"agent-governance specialist" with **"Data Science student and AI systems
builder who turns hard questions into executable evidence"** as the
site's primary identity, and replaces the single governed-run lab with a
five-item public collection — **Prism, Relay, Limen, Axiom, and Vector** —
presented bilingually (English/Spanish) as a creative editorial experience.
The site also needs exactly one narrow dynamic capability, an "Ask Diego"
question-answering endpoint, which a purely static GitHub-Pages target
cannot host.

This is a product-direction reset, not a wholesale retraction. Astro,
TypeScript, pnpm, Node, and Preact stay the accepted stack
([ADR 0002](0002-static-site-stack.md), [ADR 0003](0003-language-and-tooling.md)).
Clean-room provenance and synthetic-only data
([ADR 0009](0009-clean-room-and-synthetic-data.md)) and deterministic,
network-free testing ([ADR 0011](0011-deterministic-testing.md)) are
unaffected. What changes is: the deployment target's one static-only
exception; the status of the RunBundle/Replay/OPA/Merkle demo as the
flagship public surface; the shape of the provider seam; the rigidity of CV
rendering; and the visual direction.

## Decision

Adopt the new identity and structure described above, and explicitly
supersede the following prior decisions:

- **[ADR 0004](0004-root-github-pages-deployment.md) — GitHub Pages as the
  exclusive deployment target.** No longer serves the product: one dynamic
  `/api/ask` endpoint needs a request-time host that a GitHub-Pages-only
  target cannot provide. The target broadens to Astro static output plus a
  Vercel adapter. Astro's `output` stays `"static"`; only
  `apps/site/src/pages/api/ask.ts` sets `prerender = false`. Every other
  route stays a prerendered physical file.
- **[ADR 0006](0006-runbundle-and-replay.md) — the `RunBundle` replay
  contract**, **[ADR 0007](0007-rego-execution.md) — Rego/OPA execution**,
  and **[ADR 0010](0010-merkle-evidence-semantics.md) — Merkle evidence
  semantics.** No longer serve the product as a *public flagship* surface:
  the governed-run Replay lab is retired as the site's primary technical
  showcase because it no longer matches "Data Science student" as the
  primary identity. Retirement of the underlying code (`packages/contracts`,
  `packages/replay`, `packages/testkit`, `policies/**`, the Replay island,
  and `/lab/replay/` itself) is a separate, coordinated workstream that
  re-verifies live consumers before deleting anything — this ADR authorizes
  the product decision, not an immediate deletion. `/lab/replay/` becomes a
  permanent redirect to a smaller, honestly-labelled secondary case
  ("Personal Governance Lab") rather than the site's main showcase.
- **[ADR 0008](0008-provider-and-live-runtime.md) — the Fake/Replay/Live
  provider seam.** No longer serves the product: that seam was sized for a
  governed-run orchestrator with approvals and synthetic tool execution. It
  is replaced by a smaller, Ask-Diego-specific provider-optional seam that
  keeps the same spirit — network-free and off by default in normal tests,
  explicit enablement, exactly one provider chosen at a single server-side
  composition root — without the governance-run vocabulary (`AgentManifest`,
  `ApprovalRequest`, `PolicyDecision`, ...) it no longer needs.
- **[ADR 0005](0005-canonical-cv-rendering.md) — literal/mirror CV rendering
  as the only permitted résumé presentation.** No longer serves the product:
  exact-string mirroring was the right control while the résumé was the
  site's only content surface, but a bilingual, editorial site needs
  genuinely creative narrative and translation. It is relaxed to an
  editorial résumé companion fed by a new `cv:sync` process; zero fabrication
  is still enforced, now by the fact/narrative boundary in `AGENTS.md` rather
  than by exact-string equality.
- **[ADR 0013](0013-brutalist-editorial.md) — Brutalist Editorial** (which
  itself superseded [ADR 0012](0012-editorial-evidence-ledger.md) — Editorial
  Evidence Ledger). No longer serves the product: both directions were
  authored around the Replay ledger as the primary interaction. With that
  lab retired as the flagship surface, a new "computational editorial"
  direction is chosen through a best-of-N hero-and-map exploration and
  recorded in a forthcoming **ADR 0015** plus root `DESIGN.md`.

What remains binding and is **not** superseded by this ADR:

- the clean-room / Infosys boundary — only public specifications (W3C
  DIDs/VCs, OPA/Rego, Merkle audit trees, OpenTelemetry) may ever be
  reimplemented, cited under `content/public-sources/`
  ([ADR 0009](0009-clean-room-and-synthetic-data.md));
- synthetic-only demo/test/fixture data, forever;
- secrets never reaching a client bundle or `PUBLIC_*`/`NEXT_PUBLIC_*`-style
  variable;
- deterministic, network-free normal testing
  ([ADR 0011](0011-deterministic-testing.md));
- WCAG 2.2 AA and real `prefers-reduced-motion` behavior;
- honest disclosure of `planned`/`building` project status;
- Conventional Commits, no AI co-author trailer, trunk-based development with
  short-lived reviewed branches;
- the Astro/TypeScript/pnpm/Preact stack itself
  ([ADR 0002](0002-static-site-stack.md), [ADR 0003](0003-language-and-tooling.md)) —
  only its deployment target and island count are extended, not replaced.

## Consequences

- `AGENTS.md` is rewritten as a short, principle-based contract reflecting
  this reset; `.cursor/rules/00-tournament-safety.mdc` and `backend.mdc` are
  deleted and replaced by `00-product-safety.mdc`, `content.mdc`,
  `frontend.mdc`, `ai-guide.mdc`, `security.mdc`, and `testing.mdc`.
  `docs/architecture.md`, `docs/acceptance-criteria.md`, and
  `docs/threat-model.md` are updated in place rather than replaced.
- `docs/proposals/`, `docs/judgements/`, `docs/task-graph.md`,
  `docs/product-brief.md`, `docs/portfolio-narrative.md`, and
  `docs/design-direction.md` move out of the active tree (`git rm`, history
  preserved) because they describe the superseded product in detail rather
  than the current one. `docs/hard-constraints.md` is retired the same way;
  every invariant in it that is still true is folded into `AGENTS.md` first,
  not duplicated across two files. [ADR 0001](0001-tournament-synthesis.md)
  is untouched and remains the historical record of the original synthesis.
- New root `PRODUCT.md` (brand register: audience, positioning, brand voice,
  anti-references) and `DESIGN.md` (a stub of fixed constraints — WCAG 2.2
  AA, real reduced-motion, the anti-slop list, progressive JS — pending the
  best-of-N visual exploration) join the authority chain below this ADR.
- The retirement workstream for `packages/contracts`, `packages/replay`,
  `packages/testkit`, and `policies/**` re-runs a full consumer search,
  migrates every import/script/test/CI reference, and only then deletes code
  in a coordinated change; this ADR does not itself delete any package.
- Each ADR superseded above keeps its historical body text; only its status
  line changes to point here. No specific colors, typography, or final route
  implementation are decided by this ADR — those follow in ADR 0015 and
  later implementation work.
- `content/source/cv.yaml` remains the sole authority for every underlying
  fact. Narrative and translation creativity, wherever it is exercised, never
  extends to inventing a fact, metric, employer, date, or model result.
