# Bilingual site content

**Convention:** one YAML file per section, each with a top-level `en` and
`es` key holding the same structure with different values. Sibling
languages sit side by side in the same file on purpose — it makes it obvious
at a glance whether Spanish actually differs in register from English
(required) rather than mirroring it line for line (forbidden), and it keeps
one section's content, in both languages, in one diff.

## Files

- `hero.yaml` — identity/positioning copy for the home hero.
- `map.yaml` — the interactive map's five domain labels/descriptions (Data,
  Applied AI, Systems, Product, Learning) and how each connects to the Five
  Decisions collection.
- `education.yaml` — framing copy for the education/credentials section.
  The underlying facts render from `content/source/cv.yaml` (via
  `@portfolio/resume`) and `content/site/credentials.yaml`; this file holds
  only the section heading and intro, never a duplicated fact.
- `about.yaml` — bio paragraph and work principles. Text only: this section
  renders next to a deliberate, honest photo placeholder (AGENTS.md "No
  fabricated photography"), never an AI-generated image.
- `contact.yaml` — framing copy for the contact section. The actual
  email/LinkedIn/GitHub values render from `content/source/cv.yaml`, gated
  by `content/publication-consent.yaml`.
- `archive.yaml` — the academic archive: FridgeGuard, Nutritional Assistant,
  and Urban Threads, framed as archived coursework with the original source
  and deployments unavailable. No live demo or reconstructed screenshot is
  implied anywhere.
- `credentials.yaml` — structured credential records (see its own header
  comment); not translated, since certification names/issuers are proper
  nouns and dates/URLs, not prose.

## Rules this content follows (see `AGENTS.md`, `.cursor/rules/content.mdc`)

- Every factual claim in either language — a number, date, employer,
  outcome, team size, grade — must trace to `content/source/cv.yaml` or an
  approved `content/public-sources/` entry. Nothing here is invented.
- Spanish is genuinely edited for register and structure, not a mechanical,
  line-for-line mirror of the English. English lines fixed verbatim by the
  product brief (`PRODUCT.md`) stay fixed; everything else may be reordered,
  reframed, or restructured per language as long as the underlying facts
  match.
- `content/source/cv.yaml` itself is never edited, quoted verbatim at length,
  or duplicated fact-for-fact here — this directory holds narrative framing;
  the résumé route remains the literal source of record.
- A `planned`/`building` item (the Five Decisions manifests under
  `content/decisions/`) is never described here as shipped or verified.
