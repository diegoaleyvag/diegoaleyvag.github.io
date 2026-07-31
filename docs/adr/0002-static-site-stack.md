# ADR 0002: Use Astro static output with one Preact island

- Status: Accepted
- Date: 2026-08-01

## Context

The public product is content-heavy, must generate semantic HTML from
`cv.yaml`, must work without JavaScript for core routes, and must deploy as
physical files to a GitHub Pages user-root site. Only the Replay explorer needs
stateful browser interaction.

An SSR-first framework or full single-page application would add request-time
assumptions, client JavaScript, and routing failure modes that do not serve
these goals. A purely static generator without an island model would make the
Replay interaction less maintainable.

## Decision

Use:

- Astro with `output: "static"` for pages, layouts, and content rendering;
- TypeScript for all site code;
- one isolated Preact island under `apps/site/src/features/replay/`;
- plain CSS custom properties and authored styles, with no component library;
- progressive enhancement: initial lab explanation and run summary are static
  HTML, then Replay controls hydrate.

Home, résumé, and work-content routes ship no client framework JavaScript.
Preact is not a general component model for the rest of the site. The deferred
finite Live control may use the same lab-island boundary after its runtime and
security gates pass; it does not authorize hydration elsewhere.

## Consequences

- Core pages remain crawlable, printable, fast, and useful without JavaScript.
- Replay can use explicit state and accessible controls without hydrating the
  entire portfolio.
- The repository has two view syntaxes, Astro and Preact. The boundary is kept
  small and enforced by folder ownership.
- A future interactive feature must justify hydration and may not silently turn
  the site into an SPA.
- Framework replacement requires a superseding ADR and proof of physical
  root-route output, zero-backend Replay, and equivalent content provenance.
