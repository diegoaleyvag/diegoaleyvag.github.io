# ADR 0015: Adopt the asymmetric typographic composition as the visual system

- Status: Accepted
- Date: 2026-08-28
- Supersedes: nothing directly (ADR 0014 already retired Brutalist Editorial
  and deferred the concrete visual choice to this ADR)

## Context

ADR 0014 retired the Brutalist Editorial direction and deferred the concrete
visual system to a best-of-N exploration: three isolated, fully-working
candidates for the homepage hero and interactive capability map, each
assigned a distinct creative hypothesis and required to go through the
[impeccable skill](/Users/atomicz/.claude/skills/impeccable/SKILL.md)'s actual
font-selection procedure rather than a reflex choice, and each required to
reject both the retired Brutalist Editorial system and the generic
"editorial-typographic" AI-cliché lane (display serif + italic + small mono
labels + ruled columns + monochrome) that the skill's own reflex-reject list
names as a separate, deeper trap.

All three candidates were built as real Astro + Preact code (not static
mockups), verified with Playwright for keyboard operability and real
`prefers-reduced-motion` behavior (a behavioral removal of motion, not a
faster version of the same animation), audited with axe-core (all three:
0 violations, WCAG 2.2 AA), and measured for JS cost:

| Candidate      | Direction                          | Typography                                                     | Color strategy               | Map shape                                                           | JS (gzip) |
| -------------- | ---------------------------------- | -------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- | --------- |
| A              | Connected evidence graph           | Martian Mono (labels only) + Karla                             | Committed, cyanotype blue    | Literal bipartite SVG node graph                                    | ~7.8 KB   |
| **B (winner)** | Asymmetric typographic composition | Big Shoulders Display + Public Sans + Martian Mono (tags only) | Full palette, 4 named roles  | Woven, differentiated bipartite diagram (pentagram layout)          | ~7.7 KB   |
| C              | Warm systems schematic             | Libre Franklin + Fragment Mono (labels only)                   | Committed, diazo-print amber | Shared horizontal spine (undifferentiated per-decision connections) | ~9.6 KB   |

## Decision

Adopt **candidate B, the asymmetric typographic composition**, as the site's
visual system. Reasoning, weighing all three on the brief's own terms:

- **The map must show navigable relationships, not a decorative graph**
  (ADR 0014 / the product brief). Candidates A and B both render a real,
  differentiated bipartite structure — selecting a decision shows exactly
  which domains it draws on, and vice versa. Candidate C's shared-spine
  diagram does not differentiate which domains a given decision touches; it
  reads as the closest of the three to "decorative," so it is not chosen
  despite having the most visually arresting single-page treatment (an
  engineering title-block/diazo-print motif).
- **Between A and B, B's color strategy does real narrative work that A's
  does not.** B's four palette roles are assigned so that **Learning
  deliberately carries no "build journey" color** — the palette itself
  enforces the site's central honesty distinction (a learning-journey item
  is not a build-journey item) rather than merely decorating the page. This
  is exactly the "every visual element must answer a question" bar the
  product's visual constraints ask for.
- **B takes a real typographic risk without tipping into either reflex
  trap.** Big Shoulders Display (condensed civic/engineering-signage
  lettering) plus Public Sans (a U.S. government forms/technical-document
  workhorse) is a genuinely uncommon pairing for a portfolio, is not on the
  impeccable skill's reflex-reject list, and does not retint the retired
  system's Archivo/Archivo Black. The asymmetric, left-aligned composition
  (heavy word / light word, cascading meta column) is a real compositional
  bet rather than a centered hero stack.
- A is a strong, clean, safer choice and remains the fallback if B's
  composition proves difficult to extend to the full site in the next
  workstream; it is not chosen here because B does more work per visual
  decision at comparable JS cost and equal accessibility rigor.

## Consequences

- `DESIGN.md` is updated in place with the finalized typography, color
  roles, map pattern, and motion/reduced-motion approach below. Nothing in
  `DESIGN.md`'s fixed constraints (WCAG 2.2 AA, real reduced-motion,
  progressive JS, the anti-slop list) changes — this ADR only resolves what
  was previously left pending.
- The next workstream (`ship-vertical-slice`) ports candidate B's approach —
  not its literal throwaway code, since that used placeholder content and a
  scratch route — into the real bilingual homepage, `/work/`, and Five
  Decisions pages, driven by the manifests and content already built. It may
  freely refine spacing, copy fit, and responsive behavior; it may not
  introduce a different typographic or color system without a superseding
  ADR.
- Candidates A and C are not deleted immediately — they remain on their own
  branches/worktrees (`explore/connected-evidence-graph`,
  `design/candidate-preview-warm-schematic`) as a recorded exploration
  history until a later cleanup pass removes the worktrees; their code was
  never merged into `feat/five-decisions-reset` and needs no removal there.
- Candidate B's own worktree/branch (`design/candidate-preview-asymmetric`)
  is likewise not merged directly; `ship-vertical-slice` re-implements its
  approach against real content rather than merging throwaway
  `candidate-preview` code into the real routes.

## Verification recap (from the three candidates' own reports)

All three: 0 axe-core violations (WCAG 2.2 AA) at desktop and mobile widths,
full keyboard operability with visible focus, a complete no-JS HTML fallback
for the map, and a real (not duration-only) behavioral change under
`prefers-reduced-motion: reduce`. Candidate B's specific measurements are
carried into `DESIGN.md` below.
