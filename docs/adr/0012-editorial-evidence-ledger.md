# ADR 0012: Use the Editorial Evidence Ledger direction

- Status: Superseded by [ADR 0013](0013-brutalist-editorial.md)
- Date: 2026-08-01

## Context

The portfolio must be memorable without generic AI aesthetics, while remaining
fast and readable for recruiters and precise enough for an evidence-heavy
Replay interface. Implementing multiple themes would consume first-slice time
and weaken visual authorship.

## Decision

Choose one visual direction: **Editorial Evidence Ledger**.

Its rules are:

- warm paper, near-black ink, restrained rules, and one oxblood signal color;
- system sans for body/UI, system serif for selected openings, monospace only
  for machine identifiers;
- a reading column plus evidence rail on wide screens, collapsing to source
  details immediately after content on narrow screens;
- ledger rows rather than floating cards;
- visible provenance, sequence, state, and trust qualifications;
- native controls, visible focus, WCAG 2.2 AA, and reduced-motion behavior;
- no third-party fonts or scripts in the first slice.

Tokens live in one `tokens.css` for consistency, not for alternate theme
switching.

Prohibit gradients, glass, glow, particles, generic AI imagery, generated
portraits, fake terminals, decorative metrics, autoplay, stock dashboard card
grids, excessive pills, and unearned trust/security badges. A visual element
must communicate provenance, sequence, state, qualification, hierarchy, or
navigation.

## Consequences

- The résumé and Replay feel related without pretending they have the same
  evidence guarantee.
- Distinctiveness comes from composition and information hierarchy rather than
  asset-heavy effects.
- Tonight's design work is limited to tokens, shell, responsive ledger layout,
  typography, focus/states, Replay details, and print rules.
- Alternate themes, dark mode, custom-font production, elaborate motion, and
  illustration require separate justification after the vertical slice.
