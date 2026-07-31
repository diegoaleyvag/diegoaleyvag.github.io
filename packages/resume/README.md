# Canonical résumé loader

`loadResume()` is the only production entry point for canonical CV facts. It
reads `content/source/cv.yaml` without writing it, applies a closed schema, keeps
array order and exact UTF-8 strings, and returns immutable facts keyed by the
`CvSourcePath` union.

The returned `LoadedResume` contains:

- `view`: structured `ResumeFact` values for page composition;
- `facts`: every publishable scalar leaf in source order;
- `fact(path)`: typed source-path lookup for selected portfolio facts;
- `sourceSha256`: digest of the exact source file bytes;
- `provenance`: `/resume/` source/render digest coverage.

Factual components consume both `ResumeFact.path` and `ResumeFact.value`.
Selection and sequencing are allowed; callers must not edit, shorten, combine,
or paraphrase the value. Contact and location facts remain limited to portfolio
and résumé routes.

`tools/generate-provenance.ts` is the sole producer for
`generated/resume-provenance.json`. The artifact contains paths and digests, not
copied CV text.
