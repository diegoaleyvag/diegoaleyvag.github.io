# DESIGN.md — Fixed constraints, pending direction

Status: **Stub.** The concrete visual system — typography, color tokens, and
the winning hero+map composition — is **not decided yet**. It is chosen
through a best-of-N exploration (three isolated candidates, evaluated for
30-second comprehension, singularity, narrative, keyboard/reduced-motion
behavior, mobile, and JS cost) and recorded in a forthcoming **ADR 0015**,
which appends its specifics to this file. Nothing below hints at a
particular palette or typeface — none is chosen yet; do not infer one.

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

## What is pending

Typography, the color system, spacing/type-scale tokens, and the hero+map
composition are all pending the best-of-N exploration described above. ADR
0015 records the winning candidate and its rationale; that work appends the
resulting specifics below this line once it lands.

---

_(Nothing appended yet — see ADR 0015 when it exists.)_
