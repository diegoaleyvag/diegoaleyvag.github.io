# Synthetic fixture: external CV without `programme`

A second, fully synthetic fixture — same shape as `synthetic-cv-repo/`, minus
the optional `experience[].programme` field. Exists only to prove
`tools/cv-sync` tolerates the real external CV repository's actual shape
(which does not carry `programme`) instead of the stricter shape
`@portfolio/resume` requires for the portfolio's own `content/source/cv.yaml`.
No real person, employer, or fact is represented here.
