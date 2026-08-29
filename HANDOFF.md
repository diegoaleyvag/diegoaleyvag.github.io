# HANDOFF — Five Decisions portfolio reset

Branch: `feat/five-decisions-reset`. Not merged, not pushed, no PR opened, no
deploy performed — all explicitly out of scope for this session per
`AGENTS.md`. This document is the `verify-and-handoff` todo's output: gate
results, visual/manual evidence, an independent Opus cross-review, and open
items for Diego. **Verdict from the cross-review: safe to hand to the owner
as-is — no blocking issues, every hard invariant (facts, clean-room, secrets,
honest project states, commit hygiene) holds.** Two should-fix items it
raised are addressed below: the Governance Lab Spanish-parity gap is now
fixed in this same branch; the résumé-vs-corpus factual divergence is a
real, owner-facing decision this document surfaces rather than resolves
unilaterally (fixing it would mean an agent picking which of two true fact
sets "wins," which isn't an agent's call to make).

## Architecture

One deployable: an Astro site (`output: "static"`) behind a Vercel adapter,
almost entirely prerendered HTML plus exactly one dynamic endpoint,
`apps/site/src/pages/api/ask.ts` (`prerender = false`). Two Preact islands
ship any client JavaScript: the homepage capability map and the Ask Diego
guide (`/ask/`, `/es/pregunta/`) — every other route is framework-JS-free.
See ADR 0014 and ADR 0015 below for the reasoning; this section only maps
the resulting shape.

- **`packages/decisions`** — versioned JSON Schema + loader for
  `content/decisions/<id>/portfolio.project.json`, the only permitted source
  of a Five Decisions title, question, status, and evidence.
- **`packages/ask-corpus`** — the closed, bilingual corpus Ask Diego answers
  from, plus deterministic, network-free retrieval (no model call for
  retrieval itself).
- **`packages/resume`** — `loadResume()`, the only production entry point for
  `content/source/cv.yaml` facts; schema-validated, order- and
  string-preserving, keyed by `CvSourcePath`.
- **`tools/build-decisions`** — `pnpm decisions:build`: validates every
  decision manifest, canonicalizes field order, writes
  `apps/site/public/decisions/v1/*.json` + a SHA-256 lock manifest.
- **`tools/build-corpus`** — `pnpm corpus:build`: same shape for the Ask
  Diego corpus under `apps/site/public/corpus/v1/`.
- **`tools/cv-sync`** — `pnpm cv:sync --source <path>`: manual, read-only
  operation against the separate CV repository; copies the PDF, produces a
  preview + public JSON summary, and writes a manifest recording source
  commit + SHA-256. Never run by CI; only ever run by a human with the
  source repo path.
- **`tools/check-vercel-output`** — validates the actual Vercel Build Output
  API v3 artifact (`apps/site/.vercel/output/`): required static routes,
  exactly one server function scoped to `/api/ask`, secret-shape scanning,
  self-hosted-font/no-external-subresource checks, and the two-island JS
  budget.
- **`tools/check-content-provenance`** — validates every content leaf traces
  to `content/source/cv.yaml` or an approved `content/public-sources/`
  entry, plus the separate publication-consent gate
  (`pnpm publication:check`).
- **`tools/check-generated`** — confirms the decisions/corpus/résumé
  generated artifacts are current (their digests match their sources) so a
  stale build can never ship silently.

## Commands

Every script in the root `package.json`:

| Script              | What it does                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `build`             | Builds every workspace package/app that defines a `build` script.                                               |
| `check`             | `format:check && lint && typecheck && content:check && test && generated:check` — the fast, deterministic gate. |
| `ci:gate`           | `check && build && static:check && test:e2e` — the full release gate this session ran end to end.               |
| `content:check`     | Validates content provenance against `cv.yaml`/`public-sources`.                                                |
| `corpus:build`      | Regenerates the Ask Diego corpus artifacts from `content/corpus/**`.                                            |
| `cv:sync`           | Manual, read-only sync from the separate CV repository (never run in CI).                                       |
| `decisions:build`   | Regenerates the Five Decisions manifests from `content/decisions/**`.                                           |
| `format`            | `prettier --write .`                                                                                            |
| `format:check`      | `prettier --check .`                                                                                            |
| `generated:build`   | `decisions:build && corpus:build` in one call.                                                                  |
| `generated:check`   | Confirms generated artifacts are current, not stale.                                                            |
| `lint`              | `eslint .`                                                                                                      |
| `publication:check` | Confirms `content/publication-consent.yaml` approves contact-field publication.                                 |
| `static:check`      | Validates the deployable Vercel Build Output artifact (see above).                                              |
| `test`              | `vitest run` — unit/contract/integration suite.                                                                 |
| `test:e2e`          | `playwright test` — browser/axe/keyboard/no-JS/reduced-motion suite against the real static artifact.           |
| `typecheck`         | Per-workspace `typecheck` scripts + the three tool tsconfigs + `tests/tsconfig.json`.                           |

## Decisions

Product and architecture decisions are recorded, not re-explained here:

- [ADR 0014](docs/adr/0014-portfolio-product-reset.md) — the product reset
  (identity, Five Decisions collection, static+one-endpoint deployment,
  Replay/OPA/Merkle retirement as flagship, relaxed CV rendering).
- [ADR 0015](docs/adr/0015-computational-editorial-visual-system.md) — the
  visual system (asymmetric typographic composition: Big Shoulders Display +
  Public Sans + Martian Mono, four-role color palette, woven bipartite map).
- `docs/architecture.md`, `PRODUCT.md`, `DESIGN.md` — current-state
  documents kept in sync with the two ADRs above.

## Risks

- **Resolved: the résumé and the rest of the site now describe the same CV
  vintage.** Diego explicitly authorized this one-time sync (a normal
  exception to `cv.yaml` being read-only to agents, per `AGENTS.md`), so
  `content/source/cv.yaml` was brought in line with the same newer external
  CV that `apps/site/public/downloads/cv/summary.json` already reflected:
  three universities (adds Universidad de San Buenaventura, Bogotá,
  Aug–Dec 2026), the InStep bullet naming "CTO Rafee Tarafdar" and "~30
  teams," an Infosys end date of "Feb 2026 – Aug 2026," and the updated
  skills list. `packages/resume/generated/resume-provenance.json` was
  regenerated, `content/corpus/education/**` gained a bilingual
  San Buenaventura entry, `availability-status.json`'s "junior AI/ML"
  phrasing was updated to match the new summary wording, and
  `apps/site/src/lib/resume-es.ts` gained translations for the new
  education strings — `pnpm corpus:build`, `pnpm check`, and `pnpm build` +
  `pnpm static:check` all re-ran clean afterward. One deliberate exception:
  `cv.yaml`'s `experience[0].programme` field ("InStep Global Internship")
  was kept even though the newer external CV drops it as prose — the fact
  hasn't changed, only the newer document's wording condensed it out, and
  `programme` is a required, deeply-typed field through
  `packages/resume/src/schema.ts`/`types.ts` that several other files
  (`content/site/about.yaml`, `content/corpus/identity/identity-bio.json`)
  independently corroborate. `cv.yaml`'s three-item `certifications` list
  was also left as-is rather than folded to five: the two Claude credentials
  the newer CV merges in are already recorded in this repo in a richer,
  owner-verified `verified` shape (issuer/level/Credly URL/dates) in
  `content/site/credentials.yaml`, deliberately separate from the plain
  `terse` strings `cv.yaml` sources — duplicating them into `cv.yaml` would
  have meant either redundant entries or unraveling that verified/terse
  split for a fact that hasn't changed, so the same "don't cascade an
  architecture change for an unretracted fact" reasoning applied here too.
- **Node engine mismatch (local only).** This machine runs Node 25.9.0;
  `package.json` pins `>=24.18.1 <25.0.0`. Every command in this session ran
  with a `[WARN] Unsupported engine` line but succeeded — the Vercel adapter
  itself also warns at build time and falls back to a Node 24 runtime
  for the actual serverless function, so the _deployed_ function is
  unaffected. Still worth pinning local Node to 24.x before the next
  session to remove the warning noise and fully match CI/Vercel.
- **A stale, real-looking `GROQ_API_KEY` sits in the local, gitignored
  `.env`.** It belongs to the retired Fake/Replay/Live provider seam
  (superseded by ADR 0014) and is read by no code path in this branch —
  confirmed by grepping the full build output and the `/api/ask` function
  bundle for `GROQ`/`gsk_`, both clean. It is not committed (`git ls-files
.env` is empty) and never reaches the artifact, but it is a live-shaped
  credential sitting unused on disk; worth rotating/deleting independent of
  this branch.
- **Fixed one real, small layout bug found during verification** (see Tests
  executed → visual evidence, below) — flagging in case the cross-review
  agent flags the same area independently so it isn't double-reported as a
  second bug.
- The 400%-zoom-equivalent check on `/resume/` still reports a 3px
  `scrollWidth`-vs-`clientWidth` gap after the fix, with no single
  overflowing element found in a full DOM scan and nothing visible in the
  screenshot. Read this as sub-pixel flex-layout rounding, not a confirmed
  defect — but it's an honest residual, not a fully closed loop.
- `pnpm audit --audit-level high` and `--audit-level high --prod` both pass
  today (0 high/critical), but the 5 remaining low/moderate Astro/esbuild
  advisories only have patches on Astro ≥7.0.6–7.0.10 / esbuild ≥0.28.1 /
  `@astrojs/vercel` ≥11.0.3 — all majors past this plan's explicit "stay on
  Astro 6, target 6.4.8" boundary. Re-evaluate next time a real Astro 7
  migration is in scope.

## Debt

Explicitly deferred, by earlier deliberate scope decisions in this same
branch, not oversights of this session:

- **Ask Diego's rate limiter is in-memory and per-instance.** Documented
  in-code (`apps/site/src/lib/ask-diego/rate-limiter.ts`): a cold start
  resets the counters, and concurrent warm instances each keep their own —
  so the "~5/min, ~20/day" limits are real per-instance caps, not one global
  ceiling. A platform-level mechanism (Vercel Firewall) is the intended
  eventual replacement; the code already has a swappable `RateLimiterStore`
  seam for it.
- **No live AI Gateway provider is configured.** `AI_GUIDE_MODEL` /
  `AI_GUIDE_API_KEY` are empty in `.env.example`; `/api/ask` runs
  corpus-only and falls back to the static FAQ, by design (ADR 0014, "Ask
  Diego: provider-optional, closed, degradable"). Confirmed the built
  function reads these from `process.env` at request time only — nothing is
  inlined into the bundle at build time.
- **No real Vercel project, domain, WAF, or budget is configured** — the
  plan scoped this out explicitly ("No configurar proyecto Vercel, dominio,
  WAF, presupuesto ni Git integration en esta sesión").

## Files changed

`git diff --stat main...feat/five-decisions-reset` — 296 files touched
(one dir-rename artifact line included), +18250/−13728, grouped:

| Area                                                                                                                                                              | Files |    + |    − | Notes                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | ---: | ---: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/`                                                                                                                                                           |   117 | 8723 | 2787 | The Astro site itself: routes, layouts, the two Preact islands, `/api/ask.ts`, styles, content loaders.                                                                                            |
| `packages/`                                                                                                                                                       |    44 | 2619 | 2635 | Net-neutral by design: `contracts`→retired, `replay`→retired, `testkit`→retired; `decisions` and `ask-corpus` added; `resume` extended.                                                            |
| `tools/`                                                                                                                                                          |    37 | 2061 | 1196 | `build-replays`/`opa` retired; `build-decisions`, `build-corpus`, `cv-sync` added; `check-static-output` replaced by `check-vercel-output`; `check-content-provenance`/`check-generated` extended. |
| `content/`                                                                                                                                                        |    34 | 1080 |   56 | New bilingual manifests, corpus entries, credentials, CV-sync output — additive; nothing in `content/source/cv.yaml` touched.                                                                      |
| `tests/`                                                                                                                                                          |    12 | 1555 |  221 | New contract tests (Ask Diego request/response/provider/rate-limiter), `vertical-slice.spec.ts` replacing `tonight-slice.spec.ts`, integration coverage for résumé/site content.                   |
| `docs/`                                                                                                                                                           |    25 |  817 | 5730 | ADR 0014/0015 added; superseded proposal/judgement/task-graph docs moved out of the active tree (history preserved via `git rm`), not deleted from Git history.                                    |
| `.cursor/` (rules)                                                                                                                                                |     8 |  156 |  186 | `00-tournament-safety.mdc`/`backend.mdc` retired; `00-product-safety.mdc`, `content.mdc`, `frontend.mdc`, `ai-guide.mdc`, `security.mdc`, `testing.mdc` added.                                     |
| `policies/`                                                                                                                                                       |     4 |    0 |  226 | Rego/OPA source fully retired with the Replay stack.                                                                                                                                               |
| Root docs (`AGENTS.md`, `DESIGN.md`, `PRODUCT.md`, `README.md`)                                                                                                   |     4 |  303 |  202 | `AGENTS.md` rewritten short-form; `DESIGN.md`/`PRODUCT.md` new.                                                                                                                                    |
| Config/lockfile (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `vitest.config.ts`, `.env.example`, `.prettierignore`, `.github/`) |     9 |  936 |  411 | Astro 6.4.8 + `@astrojs/vercel` 10.x, dependency patches, retired GitHub Pages deploy workflow.                                                                                                    |

## Tests executed

Everything below ran in this session, from a clean state, in the order
requested:

| Command                                                                                                                                                                                           | Result                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `rm -rf apps/site/dist apps/site/.vercel`                                                                                                                                                         | done                                                                                      |
| `pnpm install --frozen-lockfile`                                                                                                                                                                  | **pass** (lockfile satisfied; only the expected Node-engine warning)                      |
| `pnpm ci:gate` (`format:check`, `lint`, `typecheck`, `content:check`, `test` — 148 unit/contract/integration tests, `generated:check`, `build`, `static:check`, `test:e2e` — 31 Playwright tests) | **pass**, exit 0, confirmed twice (once before, once after the résumé CSS fix below)      |
| `pnpm audit --audit-level high`                                                                                                                                                                   | **pass** — 5 vulnerabilities found, all low/moderate (2 low, 3 moderate); 0 high/critical |
| `pnpm audit --prod --audit-level high`                                                                                                                                                            | **pass** — same 5, all in the `astro`/`@astrojs/vercel`/`esbuild` dependency chain        |
| `pnpm publication:check`                                                                                                                                                                          | **pass** — contact-field publication consent is approved                                  |

**What I found and fixed:** the initial full `pnpm test:e2e` run (26 tests)
passed cleanly, but its route list predated the Ask Diego routes landing —
`/ask/` and `/es/pregunta/` had no console-error or axe-core coverage. I
extended `tests/e2e/vertical-slice.spec.ts`'s shared `routes` array and its
axe-core loop to include both (now 31 tests, all passing) rather than write
a separate one-off script for permanent coverage.

**Real bug found and fixed via the zoom/reflow check** (small, in scope to
fix directly): at the 400%-zoom-equivalent effective viewport (360px) _and_
already at the standard 375px mobile breakpoint, `/resume/`'s header photo
preview + "Download the PDF" button row (`.resume-header__actions`) didn't
wrap, overflowing the viewport by 22px at 375px and 37px at the 400%-zoom
width. Fixed with `flex-wrap: wrap` on the actions row and `max-width: 100%`
on the preview image (`apps/site/src/routes/ResumePage.astro`) — re-verified
overflow-free at 375px, and re-ran the full `ci:gate` afterward (still
green). See Risks for the one still-open, sub-pixel residual on this same
check.

### Visual evidence (this session, new)

All screenshots and the throwaway capture script are under `evidence/` at
the repo root (deliberately outside `apps/site/`, gitignored-worthy but not
yet added to `.gitignore` — treat as scratch output, not shipped content).
Captured against the real deployable artifact
(`apps/site/.vercel/output/static/`) via the same static server the e2e
suite uses.

**Screenshots** (`evidence/screenshots/`, 1440px and 375px each):
`home-en`, `home-es`, `work-en`, `work-prism-en`, `resume-en`, `ask-en`,
`ask-es` — 14 files. (`/work/` in Spanish and per-decision pages weren't
separately screenshotted beyond `work-prism-en`; the requested route list
was `/`, `/es/`, `/work/`, `/work/prism/`, `/resume/`, `/ask/`,
`/es/pregunta/`, all seven of which are covered — `home-es` doubles as the
`/es/` capture and `ask-es` as `/es/pregunta/`.)

**Console errors:** zero, on every one of the 7 routes at both widths
(confirmed by the throwaway script's own listener, independent of the
Playwright suite's check).

**Axe-core:** the extended `vertical-slice.spec.ts` now runs axe (WCAG 2.2
AA tags, serious/critical filter) on `/`, `/es/`, `/work/`, `/work/prism/`,
`/resume/`, `/ask/`, `/es/pregunta/` — 0 violations on all seven, part of
the 31-test `pnpm ci:gate` pass above (not a separate one-off run).

**Keyboard operability and visible focus** — manual Playwright tab-through
(not part of the permanent suite, since it's exploratory rather than a
fixed assertion) on `/`, `/work/prism/`, `/ask/`: every focused element (nav
links, language switcher, hero CTA, map trigger, FAQ `<summary>` elements)
got a real `outline: solid 3px`, never `none` or a box-shadow substitute,
and 10/10 tab stops per route landed on a visible, in-viewport element. No
focus trap or skipped-interactive-element observed in this manual pass.

**200%/400% zoom (reflow) check** — done as a real, scripted Playwright
check, not a manual description, but honestly: Chromium/Playwright has no
direct "browser zoom" emulation API. I used the standard WCAG 1.4.10
reflow-testing equivalent — resize the viewport to `width ÷ zoom-factor`
(200% → 720px, 400% → 360px from a 1440px baseline), which is what real
browser zoom does to the effective CSS-pixel layout width — and checked
`scrollWidth` vs `clientWidth`. Result: `/` is clean at both levels;
`/resume/` was not (see the fix above) and is now clean at 200% and
effectively clean at 400% (3px residual noted in Risks, not user-visible in
the captured screenshot).

**`prefers-reduced-motion`** — not re-derived; confirmed still passing as
part of the same `pnpm ci:gate` / `test:e2e` run above (`removes map
selection motion under prefers-reduced-motion`, part of the 31).

**Secrets in the deployed artifact** — `tools/check-vercel-output` already
scans `apps/site/.vercel/output/{static,functions}` for client-exposed
`PUBLIC_*`/`NEXT_PUBLIC_*`-style secret names, bearer-auth headers, and
`sk-`-shaped keys, and it passed as part of `static:check` above. I
additionally spot-checked myself: grepped the full built artifact for the
retired `GROQ_API_KEY`'s actual value and for `GROQ`/`gsk_` generally (both
clean — that key belongs to a superseded provider seam and is read by no
current code path), and read the `/api/ask` function's bundled source
directly to confirm `AI_GUIDE_API_KEY`/`AI_GUIDE_MODEL` are read from
`process.env` only at request time, never inlined at build time (both
empty in this build, so the function runs corpus-only/fallback, as
expected with no provider configured).

### Post-review fix and final re-verification

After the Opus cross-review reported its should-fix items, the Governance
Lab Spanish-parity gap was fixed directly (see Cross-review findings below)
and the full gate was re-run once more from a clean state: `pnpm check`
(148/148 unit tests), `pnpm build` (23 prerendered routes, 1 function), and
`pnpm test:e2e` (31/31) — all green, confirming the fix didn't regress
anything the earlier passes had already verified.

### Tests from earlier workstreams (pre-existing, re-confirmed by re-running the full gate above rather than re-derived independently)

The branch's prior commits (content registry, retirement of Replay/OPA/
Merkle, best-of-N visual exploration → ADR 0015, vertical slice, Ask Diego)
each landed with their own passing `check`/`build`/test runs per their
commit messages and `docs/architecture.md`'s "landed" notes. This session
did not re-derive that history — it re-ran the entire gate from a clean
`rm -rf dist .vercel` + frozen-lockfile install, which is the strongest
re-confirmation available (a stale artifact or drifted lockfile would have
failed here even if an earlier workstream's own run had passed).

## Open questions for Diego

Pulled from the plan's "Inputs obligatorios de Diego antes de producción"
framing — all explicitly out of scope for this session (AGENTS.md: no
Vercel project/domain configuration, no fabricated photography, Governance
Lab assets require an approved intake location that doesn't exist yet):

1. ~~**A real photograph** to replace the honest typographic
   placeholder~~ — **resolved**: Diego supplied a real photo directly in
   this session (`apps/site/src/assets/diego-portrait.jpg`).
   `AboutPortrait.astro` now renders it via Astro's built-in image
   pipeline (AVIF + WebP + JPEG fallback, explicit dimensions, no
   third-party request); `sharp` was added as a direct `apps/site`
   dependency (already security-pinned in `pnpm-workspace.yaml`) since
   Astro's image service needs it resolvable from that package specifically.
2. **The two Credly URLs** — already provided and in use. Confirmed in
   `content/site/credentials.yaml`:
   `https://www.credly.com/badges/844c78b3-1d88-4d41-9d33-c85d3656270d`
   (Foundations, issued 2026-08-11) and
   `https://www.credly.com/badges/cf6716a1-74dc-4bb7-87cf-1ced05248ed8`
   (Professional, issued 2026-08-13) — please double-check these resolve to
   the correct live badges on your end; this session only confirmed they're
   the ones recorded in content, not that they're still live/correct on
   Credly's side.
3. **Any Governance Lab assets** Diego wants to place in an approved intake
   location, to move `/work/governance-lab/` and its now-Spanish-complete
   counterpart past their current honest, minimal state.
4. **Final Vercel project/domain/AI Gateway key setup** — no Vercel project,
   custom domain, WAF rule, spend budget, or `AI_GUIDE_MODEL`/
   `AI_GUIDE_API_KEY` value exists yet. Until these are set, the site is
   correctly build-and-deploy-ready but Ask Diego will only ever answer from
   the closed corpus/fallback FAQ in production, by design.

## Cross-review findings (Opus)

An independent, read-only review of the full `main...feat/five-decisions-reset`
diff, requested explicitly per the original brief's "Revisor cruzado: Opus
4.8" role. It made no edits; it re-verified claims empirically (ran its own
`pnpm build`, grepped the real `.vercel/output` for secrets/retired-system
leakage, ran `pnpm audit --audit-level high`, traced the building/planned
status distinction end-to-end from schema through rendered CSS) rather than
trusting prior workstream reports.

**Verdict: safe to hand to the owner for review as-is. No blocking issues.**

**Should-fix (both addressed above/in this branch):**

1. Résumé-vs-corpus factual divergence — see Risks above; left as an open
   decision for Diego rather than resolved unilaterally.
2. Governance Lab had no Spanish counterpart, despite being linked from
   Spanish pages — **fixed in this branch** (commit `fix(i18n): add the
Governance Lab's Spanish counterpart page`): a genuine `/es/trabajo/
governance-lab/` translation now exists, wired into the route map, both
   pages' `alternatePath`, the sitemap, and the deployment checker's
   required-route list. Re-ran the full gate afterward — still green
   (23 prerendered routes, 31/31 e2e).

**Notes (no action required):**

3. The two Claude credentials (`content/site/credentials.yaml`) rest on
   Diego's in-session confirmation plus the live Credly URLs this session
   fetched — nothing in-repo can independently re-verify them later. Diego
   should confirm both URLs still resolve correctly before publishing (see
   Open questions #2).
4. `SITE_URL`'s placeholder default (`https://diegoaleyvag.vercel.app`)
   correctly flows into canonical/OG/hreflang tags in the build — expected
   and already flagged in Open questions #4; not scope creep, no real
   Vercel project was configured.
5. The reviewer's local Node (25.9.0) is outside the repo's pinned range —
   a reviewer-machine artifact, not a repository issue (CI pins via
   `.node-version`).

**What the review confirmed clean, explicitly and empirically (not just
"nothing found"):** the five decision manifests contain zero invented
questions/evidence for the four `planned` items; the building/planned
distinction is structurally enforced (schema → SHA-256-locked registry →
rendered badge class → dashed-vs-solid CSS) rather than cosmetic; the
Governance Lab placeholder cites only public specifications, with zero
occurrences of `RunBundle`/`Merkle`/`ApprovalRequest`/the retired Replay
island anywhere in the built output; `pnpm audit --audit-level high` and
`--prod` both report zero high/critical; no secret of any shape appears in
the static output or the function bundle, and the Ask-Diego provider key is
read from `process.env` only at request time; every one of Ask Diego's
hard limits (closed corpus, ≤4 fragments/≤4 history turns, citation
validation against exactly the fragments sent, honest fallback on every
provider failure mode, no prompt/response logging, opaque non-cookie
session key) is enforced in code, not just documented; all 34 commits are
Conventional Commits authored and committed by Diego Leyva with no AI
co-author trailer; no push/PR/deploy was performed.
