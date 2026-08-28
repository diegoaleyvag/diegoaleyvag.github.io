# Synthetic CV repository fixture

A minimal, fully synthetic stand-in for the real, separate CV repository
`tools/cv-sync` reads from. Every value in `cv/general/cv.yaml` and the text
inside `cv/general/diego-leyva-cv.pdf` describes a fictional "Ada Fixture" —
no real person, employer, date, or outcome. Automated tests point
`--source` at this directory, never at the real external path, so they stay
hermetic and network-free (`.cursor/rules/testing.mdc`).

This directory intentionally mirrors the real repository's layout
(`cv/general/cv.yaml`, `cv/general/diego-leyva-cv.pdf`) so the tool under
test exercises its real, hardcoded relative paths — only the source root is
swapped for a synthetic one.
