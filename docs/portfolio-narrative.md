# Canonical portfolio narrative

Status: **Canonical content plan**

This document defines selection and sequence only. It does not create a new
biography. Every statement about Diego must be rendered from an exact
`content/source/cv.yaml` value through a typed source path.

## 1. Opening identity

Render these source paths exactly, without an added superlative or tagline:

- `name`
- `headline`
- `location`
- `availability`
- `summary`
- `email`
- `linkedin.label` and `linkedin.url`
- `github.label` and `github.url`

Allowed surrounding labels are neutral navigation: “Résumé,” “Email,”
“LinkedIn,” “GitHub,” and “Inspect the synthetic lab.”

Do not add a portrait biography, testimonial, employer logo, endorsement,
seniority label, “production-scale” qualifier, or rewritten summary.

## 2. Home-page evidence sequence

### A. Experience

Use `experience[0].organisation`, `role`, `programme`, `dates`, and `location`
exactly. A compact home view may select source bullets, but each selected bullet
must remain verbatim and carry its original source path.

The home view should prefer bullets that establish the themes already present
in the source:

- `experience[0].bullets[0]`
- `experience[0].bullets[2]`
- `experience[0].bullets[4]`
- `experience[0].bullets[5]`

This selection is not permission to infer an employer architecture, operational
scale, ownership beyond the verbs in the source, or a new outcome.

### B. Projects

Show `projects[0]`, `projects[1]`, and `projects[2]` in source order.

For each project, render its exact `name`, `descriptor`, `dates`, and source
bullets. Do not transform bullets into an invented problem/process/outcome case
study. Numbers may appear only inside the exact source string that contains
them; they are prose evidence, not decorative counters.

### C. Education

Render `education[0]` and `education[1]` in source order with exact institution,
credential, dates, location, and detail.

Do not normalize dates, expand credentials, calculate a graduation year,
convert grades, or characterize academic standing.

### D. Skills and certifications

The home page may show source categories as a compact index. `/resume/` must
render every `skills[*].label`, `skills[*].value`, and `certifications[*]`
exactly and in source order.

Do not add proficiency levels, years of experience, technology groupings,
certification issuers, or inferred specializations beyond the source strings.

## 3. Lab transition

The governed-run lab is not a résumé entry and not an employer deliverable.
Introduce it with product copy that makes that boundary explicit:

> A synthetic, clean-room portfolio demonstration built from public
> specifications.

Supporting copy may explain the repository's current behavior:

> Replay uses checked-in synthetic runs and works without a backend. It shows
> recorded policy decisions and demonstrates event tamper detection relative to
> each bundle's included Merkle root.

Do not connect the lab to proprietary employer implementation details, use an
employer name in demo identifiers, or claim that the lab proves a CV statement.

## 4. Complete résumé

`/resume/` is the complete record and the canonical web résumé. It renders all
publishable leaves from:

- top-level identity and contact fields;
- `summary`;
- `experience`;
- `projects`;
- `education`;
- `skills`;
- `certifications`.

It is semantic, selectable, printable, linkable, responsive, and useful without
JavaScript. No hand-maintained résumé copy may exist beside it.

## 5. Editorial rules

Allowed:

- selecting which exact source entries appear on an abbreviated route;
- sequencing complete entries for the intended reading path;
- neutral headings, labels, and calls to navigation;
- visual abbreviation of hashes and IDs when the full value remains available
  to assistive technology;
- product copy describing behavior that exists in this repository.

Not allowed:

- paraphrasing, shortening, “polishing,” or combining CV facts;
- converting source bullets into inferred case-study prose;
- extracting an exact number into a new claim or decorative metric;
- adding adjectives such as “expert,” “senior,” “production-scale,”
  “industry-leading,” or “proven”;
- inferring impact, architecture, intent, team ownership, deployment status, or
  technology not explicitly stated;
- using an LLM to write production factual copy;
- copying CV facts into demo scenarios, fixtures, telemetry, analytics, or test
  snapshots.

CSS line clamping must not hide part of a factual statement. If space is
limited, select fewer complete source fields and link to `/resume/`.

## 6. Provenance and completeness contract

Every factual render receives a source path and exact value from the résumé
loader. Build output includes a manifest with:

- route;
- source path;
- source value digest;
- rendered exact value digest;
- source-file digest.

The build fails when:

- a factual component receives free-form prose instead of a source path;
- rendered factual text differs from the source value;
- an unknown or missing CV field is encountered;
- any publishable leaf is absent from `/resume/`;
- a selected home-page claim lacks a provenance entry;
- a demo artifact contains a CV source value.

Tests derive expected values at runtime from `cv.yaml`; they do not commit a
second copy or a snapshot containing personal data.

## 7. Publication boundary

The canonical CV necessarily contains personal contact and location fields
intended for the portfolio. Those fields may be rendered only from the canonical
source and only on portfolio/résumé routes. No additional personal data source
is allowed.

Before the first public deployment, the repository owner must explicitly
confirm publication of the existing email, location, and profile-link fields.
That gate does not permit copying them into logs, fixtures, telemetry, or demo
data.
