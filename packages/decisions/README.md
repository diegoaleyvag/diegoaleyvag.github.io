# Five Decisions manifest schema and registry

`portfolioProjectSchema` is the versioned, closed JSON Schema for one
`content/decisions/<id>/portfolio.project.json` source manifest — the only
permitted source of a Five Decisions title, guiding question, status, and
evidence. `additionalProperties: false` everywhere: an unknown or missing
field fails validation, never a silent pass.

`loadDecisionManifests()` reads every manifest under `content/decisions/`,
validates each one, checks that its `id` matches its directory name, rejects
duplicate ids, and returns entries sorted by id for deterministic downstream
output. `status` (`planned | building | verified | released`) and
`buildStarted` are the only fields a UI may render as project state — never
freehand copy (AGENTS.md).

`tools/build-decisions` is the sole producer of the canonicalized JSON and
lock file under `apps/site/public/decisions/v1/`, validated on write against
`decisionRegistryManifestSchema` from this package.
