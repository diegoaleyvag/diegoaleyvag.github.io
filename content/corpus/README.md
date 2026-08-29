# Ask Diego corpus

The closed, bilingual source content Ask Diego answers from
(`.cursor/rules/ai-guide.mdc`, `AGENTS.md`). Every entry is validated against
`@portfolio/ask-corpus`'s closed JSON Schema and built by `pnpm corpus:build`
into `apps/site/public/corpus/v1/**` plus
`packages/ask-corpus/generated/corpus-bundle.json`.

## File layout

One JSON file per entry, grouped into subdirectories by `category` purely
for human browsing — the loader scans `content/corpus/**/*.json`
recursively, so the directory nesting itself carries no schema meaning. A
file's name (without `.json`) must equal its own `id` field.

```
content/corpus/
├── identity/       # bio, positioning — category "identity"
├── decisions/      # one entry per Five Decisions item — category "decision"
├── credentials/    # Anthropic + terse cv.yaml certifications — category "credential"
├── education/      # ESCOM, Queen Mary exchange — category "education"
├── availability/   # open-to-remote/relocation status — category "availability"
└── faq/            # general questions, incl. Ask Diego's own scope — category "faq"
```

## Entry shape

```json
{
  "schemaVersion": "1.0.0",
  "collection": "ask-corpus",
  "id": "decision-prism",
  "category": "decision",
  "citationId": "work/prism",
  "en": {
    "label": "...",
    "question": "...",
    "answer": "...",
    "keywords": ["..."]
  },
  "es": {
    "label": "...",
    "question": "...",
    "answer": "...",
    "keywords": ["..."]
  }
}
```

- `answer` is capped at 280 characters by the schema — the
  `ai-guide.mdc` guideline is enforced here as a hard authoring ceiling,
  since a curated static string has no excuse to exceed it (a
  model-generated answer is enforced separately, with graceful truncation,
  in `apps/site/src/lib/ask-diego/response.ts`).
- `keywords` are curated matching hints, weighted higher than incidental
  words by `@portfolio/ask-corpus`'s deterministic search
  (`packages/ask-corpus/src/search.ts`) — include the phrasing a visitor is
  actually likely to type, in both languages, not just formal vocabulary.
- Spanish is a genuinely edited rendering of the same facts, never a
  mechanical mirror of the English sentence structure (same rule as
  `content/site/**`).

## Citation-id convention

`citationId` is a stable identifier into the site's route space, documented
here rather than hardcoded as a full URL, so a future route rename touches
one table instead of every entry that cites it. `/api/ask` only ever
validates that a citation id it returns to the client was present in the
retrieved context — it does not resolve or verify the route lives on disk —
but every id below is chosen to resolve cleanly once its owning route
exists.

| `citationId`                    | Resolves to (en / es)                           | Status in this worktree                                                      |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `home`                          | `/` / `/es/`                                    | exists today                                                                 |
| `resume`                        | `/resume/` / `/es/cv/`                          | exists today (English only until the `/es/cv/` workstream lands)             |
| `resume#experience-heading`     | `/resume/#experience-heading`                   | exists today                                                                 |
| `resume#education-heading`      | `/resume/#education-heading`                    | exists today                                                                 |
| `resume#skills-heading`         | `/resume/#skills-heading`                       | exists today                                                                 |
| `resume#certifications-heading` | `/resume/#certifications-heading`               | exists today                                                                 |
| `ask`                           | `/ask/` / `/es/pregunta/`                       | added by this workstream                                                     |
| `work`                          | `/work/` / `/es/trabajo/`                       | pending the vertical-slice workstream (`docs/architecture.md` §4)            |
| `work/<decision>`               | `/work/<decision>/` / `/es/trabajo/<decision>/` | pending; `<decision>` is one of `prism`, `relay`, `limen`, `axiom`, `vector` |

## Provenance

Every fact traces to `content/source/cv.yaml` (read-only), `content/site/**`
(bio, contact, education framing), or `content/decisions/**` (Five
Decisions manifests) — never invented. No project is described as more
advanced than its manifest's `status` field states; `planned`/`building`
items are described that way explicitly, never implied as shipped.
