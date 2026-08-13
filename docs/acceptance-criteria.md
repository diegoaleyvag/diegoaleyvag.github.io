# Acceptance criteria

Status: **Binding**

These criteria govern the Five Decisions product reset
([ADR 0014](adr/0014-portfolio-product-reset.md)). A task is not complete
because files exist; the observable behavior below must hold. This document
does not restate every historical "tonight" gate from the original
architecture — see `docs/architecture.md` section 8 for what that surface
was and why it no longer governs acceptance.

## 1. Identity and narrative

- [ ] A first-time visitor can tell, within 30 seconds on the home page,
      that Diego is a Data Science student and AI systems builder — not that
      agent governance is his primary identity.
- [ ] The Five Decisions collection (Prism, Relay, Limen, Axiom, Vector)
      reads as five real questions with their own framing and stakes, not as
      five generic repository cards.
- [ ] No claim anywhere on the site exceeds the evidence available for it: a
      fact traces to `content/source/cv.yaml` or an approved
      `content/public-sources/` entry; a result or outcome is stated only
      when supporting evidence exists.
- [ ] The learning journey (May–August 2026) and the public build journey
      (from August 2026) are visually and textually distinct; no copy
      implies a Five Decisions build existed before the learning window
      ends.

## 2. Honest project state

- [ ] Every project/decision status badge (`planned`, `building`,
      `verified`, ...) is read from a validated manifest field, never
      freehand copy.
- [ ] A `planned` or `building` item is unmistakably marked as not yet
      shipped or verified, in both its visual treatment and its text.
- [ ] `verified` is never applied without a recorded, checkable piece of
      evidence behind it.

## 3. Ask Diego graceful degradation

- [ ] With no provider configured, the site still builds, still deploys, and
      Ask Diego still returns a useful static-FAQ fallback rather than an
      error or a dead feature.
- [ ] A provider failure (`402`/`429`/`503`/timeout) produces the same kind
      of graceful fallback, not a broken page.
- [ ] No page other than the Ask Diego surface depends on a provider being
      configured.

## 4. Bilingual parity

- [ ] Every route required in English (`/`, `/work/`, per-decision pages,
      `/resume/`, `/ask/`) has a Spanish counterpart (`/es/`,
      `/es/trabajo/`, ..., `/es/cv/`, `/es/pregunta/`) with
      essential-content parity — the same facts, evidence, and calls to
      action, in a naturally written translation.
- [ ] Neither language ships a claim, project, or status the other omits.

## 5. Accessibility and performance

- [ ] Automated WCAG 2.2 AA checks report no serious/critical violation on
      every required route, in both languages.
- [ ] `prefers-reduced-motion` removes non-essential motion; no content or
      understanding depends on motion.
- [ ] Essential content and navigation work with JavaScript disabled.
- [ ] No known accessibility or performance regression ships in a release.

## 6. Secrets and privacy

- [ ] No API key or model-provider credential reaches a client bundle,
      browser code, or a `PUBLIC_*`/`NEXT_PUBLIC_*`-style variable.
- [ ] No private question bank, private code, or full prompt/response log
      ships in the repository or the deployed artifact.
- [ ] All demo, fixture, and corpus content is synthetic or drawn from
      approved sources; no real visitor-submitted data is stored or logged.

## 7. Coordinated retirement

- [ ] Before any retired package or route is deleted, a fresh search
      confirms it has no remaining live consumer (import, script, test, or
      CI reference).
- [ ] Each retirement decision is documented — this ADR, and, where a
      package is actually removed, the commit that removes it — rather than
      silently disappearing.
- [ ] `/lab/replay/` keeps working as a permanent redirect rather than
      becoming a dead link once its lab is retired.

## 8. Definition of done

A change is done only when the acceptance checks above pass for the routes
and features it touches, its generated artifacts (manifests, locks,
`cv:sync` output) are current, and no live network call or secret was
required to verify it.
