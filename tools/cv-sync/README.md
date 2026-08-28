# CV sync (manual, read-only)

`corepack pnpm cv:sync --source "<path to the separate CV repository>"` is a
manual operation, never a build or CI step. It:

1. Reads exactly two files under `--source`, read-only:
   `cv/general/cv.yaml` and `cv/general/diego-leyva-cv.pdf` — that
   repository's real layout. It never hardcodes a path, never clones or
   fetches anything remote, and never writes anything back into `--source`.
2. Copies the PDF to `apps/site/public/downloads/cv/diego-leyva-cv.pdf`.
3. Derives `apps/site/public/downloads/cv/summary.json` from the source
   repository's own `cv.yaml` — validated against `tools/cv-sync`'s own
   closed schema (`src/schema.ts`), a slightly more permissive sibling of
   `@portfolio/resume`'s schema for `content/source/cv.yaml` (the two
   repositories are maintained independently and the external file is not
   guaranteed to carry every optional field the portfolio's own copy does,
   e.g. `programme`) — so the summary describes exactly what the synced PDF
   says, never the portfolio's separate copy.
4. Best-effort rasterizes page 1 to
   `apps/site/public/downloads/cv/preview.png` using a `pdftoppm` binary if
   one is on `PATH`. If none is available, or rasterization fails for any
   reason, it skips the preview rather than blocking or fabricating one.
5. Writes `apps/site/public/downloads/cv/manifest.json`, recording the
   source commit (`null` if the source isn't a git repository), the sync
   timestamp, each written file's path and SHA-256, and the preview's status
   (a record, or `null` with a short `previewUnavailableReason`).

All writes under `apps/site/public/downloads/cv/` are atomic (temp file,
then rename).

Automated tests (`tools/cv-sync/test/`) point `--source` at the fully
synthetic fixture in `test/fixtures/synthetic-cv-repo/` — never the real
external path — so they stay hermetic and network-free, and inject a fake
rasterizer to exercise both the success and unavailable branches
deterministically regardless of what is actually installed on the machine
running the tests.
