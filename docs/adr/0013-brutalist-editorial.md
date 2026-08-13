# ADR 0013: Replace Editorial Evidence Ledger with Brutalist Editorial

- Status: Superseded by [ADR 0014](0014-portfolio-product-reset.md)
- Date: 2026-08-01
- Supersedes: [ADR 0012](0012-editorial-evidence-ledger.md)

## Context

ADR 0012's restrained direction shipped for the first vertical slice: warm
paper, near-black ink, one oxblood signal color, system fonts only, and an
explicit "no oversized hero, no ALL CAPS" rule. After reviewing the built
site, the owner judged it too quiet for a portfolio meant to be memorable to
recruiters and engineers — distinctive composition and information hierarchy
were not, on their own, enough visual identity.

The owner requested a bolder, self-authored identity while keeping every
substantive invariant from ADR 0012 and the rest of `AGENTS.md`: read-only CV
facts rendered through the provenance loader, the same evidence-language
constraints from ADR 0010, no third-party requests, WCAG 2.2 AA, and a
static-only build.

## Decision

Replace the visual direction with **Brutalist Editorial**: the same
"ledger" information architecture (sequence numbers, source paths, evidence
rails) now expressed with a louder, self-authored type and color system
instead of a restrained editorial one.

- **Type.** Self-host two Google-published, SIL OFL 1.1 grotesk faces from
  `apps/site/public/fonts/` (WOFF2, `@font-face`, preloaded, no font CDN
  request in production): **Archivo Black** for the masthead and top-level
  section openers, and variable **Archivo** for everything else — body copy,
  UI labels, and every heading below the masthead. This replaces the system
  sans/serif pairing and the later Fraunces amendment; monospace stays
  reserved for hashes, event IDs, and raw JSON.
- **Palette.** Warm paper `#f2efe6` (raised `#fbf9f3`), near-black ink
  `#16150f`, and exactly one hot coral-red signal `#e8442a`. Text usage of
  the signal (links, decision marks) uses a deepened `#c1391f` variant so it
  clears 4.5:1 against both paper tones; the brighter value is reserved for
  backgrounds and non-text UI (rules, fills, swatches) where only the 3:1
  non-text contrast floor applies. Corners are square (`--radius: 0`) and
  rules are thick (`--rule-width: 2px`, with a 1px "hairline" token for
  in-section dividers).
- **Masthead.** The home page's name sets enormous
  (`clamp(3.25rem, 13.5vw, 12rem)`, uppercase, tight leading) with an
  accent-colored trailing period, a vertical side tag, and a two-part
  meta/footer rule — the explicit hero moment ADR 0012 prohibited. Section
  headings across every route are set uppercase in the display or body face
  depending on level.
- **Ledger numbering, kept and extended.** The home page's numbered
  evidence-sequence pattern (`ledger-index` + heading + rail + body) is now
  shared verbatim by the résumé (experience/projects/education as ledger
  rows) and the lab's static sections (`01`/`02`/`03` eyebrow numerals),
  so all three routes read as one authored document family rather than
  three different templates.
- **Lab evidence gets a diagram.** The Merkle evidence already computed by
  `@portfolio/replay` is now also rendered as a labelled figure: the full
  reconstructed tree (leaves through root), the selected event's inclusion
  path and sibling hashes highlighted in place, and the in-memory tamper
  demonstration recomputing the tree so the broken path and mismatched root
  turn visibly red. This is a second, decorative (`aria-hidden`) view of
  facts already exposed as accessible text — see "Accessibility" below — and
  does not change ADR 0010's evidence semantics or required copy.
- **Motion.** ADR 0012's "Replay never auto-plays" is narrowed, not
  dropped: an explicit, user-initiated "Play run" control may step through
  a loaded run's already-verified events on a fixed interval, provided it
  ships a visible pause control, never steals focus while running (focus
  only follows a genuine manual selection), and every transition still
  respects `prefers-reduced-motion`. Nothing on the site auto-plays without
  that explicit opt-in.

The same anti-slop list from ADR 0012 still applies — gradients, glass,
glow, particles, generic AI imagery, fake terminals, decorative metrics,
autoplay, and unearned trust badges remain prohibited. Boldness comes from
type scale, color restraint (one signal color), and structure, not from
those patterns.

## Consequences

- `docs/design-direction.md` is rewritten in place to describe this
  direction; ADR 0012 stays as a historical record and is marked
  superseded.
- Tests and tooling that encoded the old direction's specifics (self-hosted
  font filenames in `tools/check-static-output` and the font-loading e2e
  test) were updated to match; no safety, provenance, or evidence-language
  test changed.
- The résumé, lab shell, and 404 page were rebuilt on the shared shell and
  ledger primitives introduced for the home page, rather than keeping
  route-specific one-off layouts.
- A future visual change requires a superseding ADR under the same bar: it
  must keep the read-only CV, clean-room, static-first, and evidence-limit
  invariants, and it must replace this ADR's specifics rather than layering
  a second direction beside them.
