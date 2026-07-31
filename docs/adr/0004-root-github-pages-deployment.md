# ADR 0004: Deploy physical routes to the GitHub Pages root

- Status: Accepted
- Date: 2026-08-01

## Context

The required publication target is the user site
`diegoaleyvag/diegoaleyvag.github.io`, served at
`https://diegoaleyvag.github.io/`. GitHub Pages provides no application server
or general rewrite layer. A repository-name base path, client-only route, or
SSR dependency would violate a hard constraint.

## Decision

- Generate one fully static directory with Astro.
- Configure the exact site origin and `base: "/"`.
- Emit directory-format physical routes such as `resume/index.html` and
  `lab/replay/index.html`.
- Use query parameters or fragments for interactive selection state, not
  dynamic client-only paths.
- Emit `.nojekyll` at the artifact root and no `CNAME`.
- Provide a real `404.html` with root-correct navigation.
- Build, crawl, and directly load the artifact from a plain static server at
  `/` before upload.
- Use official GitHub Pages artifact/deployment actions pinned to reviewed
  revisions.
- Pull requests build and test but never deploy. Pages and OIDC permissions are
  limited to the deployment job after merge.

## Consequences

- Every important route can be bookmarked and loaded without server behavior.
- Replay and the portfolio remain portable to another plain static host.
- Unknown run IDs cannot rely on dynamic routing; shareable run pages must be
  generated from a known manifest.
- The optional runtime deploys independently and cannot block the Pages build.
- Any custom domain or base-path change requires a new ADR and a full static
  route audit.
