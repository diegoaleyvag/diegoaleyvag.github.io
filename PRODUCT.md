---
register: brand
---

# PRODUCT.md — Brand register

For this portfolio, **the design is the product** — not decoration around a
résumé. This file is the brand register: audience, positioning, voice, and
anti-references. It complements, and never overrides, the fact/narrative
boundary in `AGENTS.md`: everything below paraphrases an already-established
fact from `content/source/cv.yaml` or the confirmed product brief behind
[ADR 0014](docs/adr/0014-portfolio-product-reset.md); nothing here invents a
new one.

## Audience

Recruiters and engineers evaluating Diego for junior AI/ML and Data
engineering roles. They should leave understanding who he is, what he has
actually shipped versus what he is actively building, and why that
difference is stated on purpose rather than blurred.

## Positioning

> **Data Science student · AI systems builder**
> I turn difficult questions into useful, testable systems.

A Spanish rendering of this line follows the same fact-checked, non-literal
translation rule as the rest of the site (`.cursor/rules/content.mdc`); it is
produced by the content/translation workstream, not fixed here, so that it
gets the same deliberate attention as the English original rather than a
first-draft guess.

## The story in one paragraph

Diego is a final-year Data Science student who spends May–August 2026
preparing for two architecture exams, with a Professional track arriving in
July. Five Decisions — Prism, Relay, Limen, Axiom, and Vector — is where that
preparation stops staying in his head and starts becoming code other people
can actually run and check.

## Two timelines, never blurred

- **Learning journey (May–August 2026):** exam preparation — studying,
  notes, practice. Not shipped code. Nothing on the site may imply a Five
  Decisions build existed before this window ends.
- **Public build journey (from August 2026):** Five Decisions and everything
  else a visitor can run. A `planned` or `building` label in this journey
  means exactly that — never `verified` until it is.

## Brand voice: three words

- **Graph paper.** Gridded, checkable, comfortable showing its work.
- **Punch card.** Literally executable — an instruction, not a slogan.
- **Field notebook.** Dated, observational, and honest about what's still
  open.

Not: modern, elegant, sleek, cutting-edge, innovative, seamless, or any word
that could describe a thousand other landing pages without changing.

## Anti-references

- a generic SaaS "AI product" landing page — oversized gradient hero, stock
  robot/spark iconography, a "trusted by" logo wall;
- a brutalist-terminal aesthetic — green-on-black, fake command prompts,
  hacker cosplay;
- gradients, glassmorphism, glow, or particle fields of any kind.

## Tooling note

The `register: brand` frontmatter field lets tooling distinguish this brand
copy from binding technical decisions (`docs/architecture.md`) and from the
decided visual system (`DESIGN.md`, ADR 0015). Nothing in this file overrides
`AGENTS.md`'s fact/narrative boundary or its authority order.
