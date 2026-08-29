# Five Decisions brand contract

`BRAND_VERSION=1.0.0`

This is the versioned, portable snapshot of the approved portfolio visual
language. It is a one-way export: products may copy and adapt this snapshot;
the portfolio does not import it. The canonical portfolio implementation,
`DESIGN.md`, and ADR 0015 remain authoritative.

## Identity and type

- Big Shoulders Display: identity lockups and top-level section headings.
- Public Sans: prose, UI, navigation, and headings below the top level.
- Martian Mono: short instructional and status labels only.

## Color roles

- Field: `oklch(97.4% 0.012 165)` ground and page background.
- Graphite: `oklch(19% 0.014 256)` ink, structure, and primary CTA fill.
- Survey: `oklch(52% 0.135 246)` / `oklch(37% 0.12 248)` for Data and Systems.
- Signal: `oklch(61.5% 0.16 68)` / `oklch(40% 0.135 55)` for Applied AI, Product,
  and building status.
- Learning remains neutral/dashed; it receives no build-journey color role.

## Behavior and constraints

Products preserve WCAG 2.2 AA, progressive enhancement, visible focus, and
real reduced-motion behavior. Do not introduce gradients, glass effects, fake
terminals, decorative motion, side stripes, or dashboard-card walls. The
portable CSS is a snapshot for product adapters, not a shared runtime
dependency or a portfolio stylesheet.
