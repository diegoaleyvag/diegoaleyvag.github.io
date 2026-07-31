# Redesign v2 brief — "Brutalist Editorial" (owner-chosen)

Reference mockup: open `docs/redesign/concept-b.html` in a browser to see the
exact target hero. This folder is reference-only — delete it before your final
commit.

## Why this exists

The v1 site was too restrained. The owner explicitly wants something **bold,
confident, and memorable** — agency-grade, not quiet. This brief SUPERSEDES the
"restrained / no oversized hero / no ALL CAPS" parts of
`docs/design-direction.md`. You have full creative freedom on the visual layer.
Keep only the substantive invariants listed at the bottom.

## Visual direction

- **Type:** massive grotesk display. Reference uses `Archivo Black` for the
  masthead and `Archivo` for body/UI. Self-host the chosen faces (WOFF2 in
  `apps/site/public/fonts/`, `@font-face`, preload) — no font CDN in production.
- **Palette:** warm paper `#f2efe6`, near-black ink `#16150f`, one hot signal
  `#e8442a` (coral-red). Feel free to refine, but keep a light brutalist base +
  one loud accent. Verify contrast (WCAG 2.2 AA).
- **Masthead:** the name set ENORMOUS (`clamp` up to ~14vw), uppercase, tight
  leading, with the accent-colored period ("Leyva."). This is the hero moment.
- **Structure:** thick 2px rules, hard edges (square corners), asymmetric
  layout, confident whitespace, a vertical side-tag, oversized section headers.
  No cards for prose, no soft shadows, no gradients-as-decoration.
- **Motion:** purposeful only — a considered entrance, hover affordances, and
  the lab animations below. Respect `prefers-reduced-motion`.

## Apply across every route

Home, `/resume/`, `/lab/replay/`, `404`, and the global shell/nav all adopt this
identity cohesively. The résumé should read like a strong designed document, not
a plain dump (the owner's own Typst CV is the bar to beat).

## Make the lab actually substantive (the "back")

The current lab is "one click, nothing happens." Using the REAL data and REAL
Merkle verification that already exist (`@portfolio/replay`), make a governed run
feel alive and impressive:

- **Animated step-through:** events reveal/execute in sequence (identity →
  policy → decision → tool → audit), not all at once.
- **Visual Merkle tree:** draw the tree, highlight the selected event's
  inclusion path to the root.
- **Tamper that visibly breaks:** when the user tampers, animate the broken
  node/path turning red and the root mismatch — make failure legible, not just a
  text line.
- **More texture:** at least one additional synthetic scenario/variant if time
  allows; keep the honest same-origin evidence-limit statement.

Do NOT build a real server/Groq backend (out of scope, no budget). The point is
to make the EXISTING verified governance data feel real and inspectable.

## Non-negotiable invariants (do not touch these)

- `content/source/cv.yaml` is read-only fact; render only via the existing
  provenance loader; never fabricate or embellish.
- No secret/API key in client code. No Groq call, no live test.
- Clean-room, synthetic data only; keep honest evidence-limit wording.
- Static-first: `astro build` stays green, all physical routes + `.nojekyll`,
  root-domain, no third-party requests (self-host fonts).
- Keep the test/build gate passing (`pnpm ci:gate`) and the consent-gated deploy
  intact. Update or relax any test/doc that encodes the OLD restrained visual
  rules so they match this brief — but never weaken a safety/provenance test.
- Conventional Commits, NO AI co-author trailer.
