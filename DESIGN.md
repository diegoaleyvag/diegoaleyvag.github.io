# DESIGN.md — Visual system

Status: **Decided.** The visual system below was chosen through a best-of-N
exploration (three isolated, fully-working candidates) and recorded in
[ADR 0015](docs/adr/0015-computational-editorial-visual-system.md), which
this file now reflects in full. Changing typography, color, or the map
pattern requires a superseding ADR, not an ad hoc restyle.

## Fixed regardless of which candidate wins

- **Accessibility target:** WCAG 2.2 AA, on every route, in both languages.
- **Motion:** `prefers-reduced-motion: reduce` removes non-essential
  transitions and animation outright. No content or task may depend on
  motion to be understood.
- **Progressive JavaScript:** essential content and navigation work with
  JavaScript disabled. The map and Ask Diego Preact islands are an
  enhancement, never a requirement.

## Anti-slop list (binding regardless of visual direction)

- no dashboard-card walls — grids of identical metric tiles standing in for
  prose;
- no fake terminal or command-prompt decoration;
- no generic particles, glow, or bloom effects;
- no scroll-jacking — hijacked scroll speed/position or forced-step
  scrolling;
- no carousels;
- no excessive glassmorphism — blurred translucent panels stacked for
  decoration;
- no side-stripe borders — the leftover "AI SaaS" accent-bar cliché;
- no gradient text.

## Typography

Two families, weight/scale contrast doing the work of hierarchy — never a
timid single-family choice, never a third family added by reflex:

- **Big Shoulders Display** (variable, condensed) — the hero name/identity
  lockup and top-level section headings only. A condensed American Gothic
  superfamily drawn from civic/engineering-signage lettering (railway,
  stonework), not a startup wordmark. Set large (`clamp()`-fluid), asymmetric
  — e.g. a heavy word stacked over a lighter/indented second word — never a
  centered hero stack.
- **Public Sans** — body copy, UI labels, nav, every heading below the
  top level. USWDS's workhorse sans, designed for government forms and
  technical documents; carries the "field notebook" register in prose.
- **Martian Mono** — reserved strictly for short instructional/status labels
  (map node status tags, an eyebrow label). Never body copy, never a
  blanket "technical" voice.

Neither family appears on the impeccable skill's reflex-reject list; neither
retints the retired system's Archivo/Archivo Black.

## Color — Full palette, 4 named roles

Reference point: the USGS topographic-quadrangle convention (one hue per
feature category), adapted rather than reproduced. All neutrals are OKLCH,
tinted, never bare `#000`/`#fff`.

| Role           | OKLCH (graphic / text-safe)                    | Use                                                             |
| -------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Field (ground) | `oklch(97.4% 0.012 165)`                       | Page background — pale vellum-green                             |
| Graphite (ink) | `oklch(19% 0.014 256)`                         | Text, structure, primary CTA fill                               |
| Survey         | `oklch(52% 0.135 246)` / `oklch(37% 0.12 248)` | Data + Systems domains, map grid/connectors                     |
| Signal         | `oklch(61.5% 0.16 68)` / `oklch(40% 0.135 55)` | Applied AI + Product domains, "building" status, primary accent |

**Learning deliberately carries no hue role** (dashed graphite/neutral only).
This is not a missing fifth color — it is the palette encoding the site's
core invariant that the learning journey (May–August 2026) and the public
build journey (from August 2026) are never blurred into one: an item that
hasn't started building yet does not borrow a build-journey color.

All pairings verified ≥ 4.5:1 for text, ≥ 3:1 for non-text graphic use.

## The capability map

A woven, differentiated bipartite diagram — not a literal wiring illustration
and not a decorative shared spine. Selecting any domain or decision reveals
_exactly_ which items on the other side it connects to, both visually (real
SVG connector paths, dimming unrelated nodes) and as text (an
`aria-describedby`-linked panel plus a live-region announcement). A complete,
linear "Domain → connects to → Decisions" list is always present in the DOM
as the no-JS/assistive-technology-equivalent path — never merely an `alt`
attribute standing in for the diagram.

## Motion and reduced motion

Short, purposeful `transform`/`opacity` transitions only — no scroll-jacking,
no particles, no glow. Under `prefers-reduced-motion: reduce`, motion is
**behaviorally removed**, not shortened: the relevant `animation`/`transition`
declarations live only inside `@media (prefers-reduced-motion: no-preference)`
blocks, so a reduced-motion visitor gets no from-state and no scale/transform
at all, confirmed via computed-style checks rather than assumed from duration.

## Measured cost (reference point from the winning candidate)

Island-specific component code: ~2.5 KB gzip. Shared Preact + hooks runtime
chunk (amortized across the map and Ask Diego islands once both ship): ~5.6
KB gzip. Combined cold-load budget for a page with one island: **≈ 7.7 KB
gzip** — comfortably inside the ≤ 150 KB initial-JS budget.
