# Evaluation Rubric

Judges score each proposal in `docs/proposals/` independently and blind
(without seeing other proposals or other judges' scores) and record results in
`docs/judgements/`. **Final score = sum of category scores (0–100) minus
penalties, floored at 0.**

## Scoring categories (100 points total)

### 1. Portfolio distinctiveness & narrative — 15 pts

How memorable, honest, and human is the portfolio? Does it tell a coherent
story about Diego rather than reading as a generic template?

- 13–15: Distinctive point of view, strong narrative arc, memorable within
  seconds, clearly not a template.
- 8–12: Solid and clean, some distinctive touches, but could belong to many
  candidates.
- 1–7: Generic, templated, or narratively incoherent.
- 0: Indistinguishable from a stock template.

### 2. Technical credibility & depth — 15 pts

Does the proposal demonstrate real engineering judgment appropriate to the CV
(agentic AI, RAG, governance, backend)? Are technical claims specific and
verifiable rather than buzzword soup?

- 13–15: Precise and specific, shows genuine depth matching the CV's real
  experience.
- 8–12: Competent and plausible, some genericity.
- 1–7: Shallow, buzzword-heavy, or inconsistent with the CV.
- 0: Technically incoherent or contradicts the CV.

### 3. Static/live architecture quality — 15 pts

Is the separation between the static site, Replay mode, and the optional live
runtime clean, well-justified, and genuinely provider-neutral?

- 13–15: Clean boundaries, Fake/Replay/Live are truly interchangeable, no
  leakage of live-only assumptions into the static path.
- 8–12: Workable separation with minor coupling or awkwardness.
- 1–7: Static and live paths are entangled, or the provider abstraction is
  superficial.
- 0: Static export or Replay mode is not actually achievable as designed.

### 4. MVP feasibility tonight — 10 pts

Can a credible first version realistically ship in a single evening's session,
given the proposed stack and scope?

- 9–10: Clearly scoped; a working end-to-end slice is realistic tonight.
- 5–8: Feasible with light scope-trimming.
- 1–4: Ambitious enough that tonight only yields scaffolding.
- 0: Not plausible tonight under any reasonable scope-cut.

### 5. Agent-governance & evaluation design — 15 pts

Is the clean-room agent-governance/reliability project itself well-designed —
identity/credentials, policy gates, audit evidence, observability — as a
public, standalone technical showcase?

- 13–15: Coherent design grounded in the named public specs (W3C DIDs/VCs,
  OPA/Rego, Merkle audit, OpenTelemetry), with a real evaluation/observability
  story.
- 8–12: Reasonable coverage of the concepts; evaluation story is thinner.
- 1–7: Superficial mention of the concepts without real design.
- 0: No credible governance/evaluation design, or it depends on non-public
  sources.

### 6. Maintainability & testing — 10 pts

Is the proposed structure easy to extend and reason about? Is there a
credible, concrete testing strategy?

- 9–10: Clear module boundaries, sensible conventions, concrete test strategy
  (unit + integration) that doesn't require live services.
- 5–8: Reasonable structure; testing strategy present but thin.
- 1–4: Unclear ownership boundaries or no real testing plan.
- 0: No maintainability or testing consideration at all.

### 7. Security & clean-room compliance — 15 pts

Does the proposal correctly keep secrets server-side, avoid any proprietary
Infosys reuse, and keep all data synthetic?

- 13–15: Explicit, correct secret handling; explicit clean-room boundary;
  explicit synthetic-data policy.
- 8–12: Mostly correct with minor gaps or unstated assumptions.
- 1–7: Meaningful gaps (e.g. ambiguous secret flow, unclear provenance of
  "governance" content).
- 0: Any plausible path to a real secret leak or proprietary-IP reuse.

### 8. Deployment simplicity — 5 pts

How simple is it to deploy and operate, especially the static site on GitHub
Pages at the domain root?

- 5: One clear, simple deploy path per component; root-domain Pages export is
  trivial.
- 3–4: Deployable but with extra steps or fragility.
- 1–2: Deployment is complex or underspecified.
- 0: No credible deployment path to a user-root GitHub Pages site.

## Penalties (subtracted from the total; total is floored at 0)

| Penalty | Deduction | Notes |
| --- | --- | --- |
| Generic AI aesthetics (stock gradients, default component-library look, cliché "AI" iconography) | −10 | Directly undermines distinctiveness. |
| Resume-as-decoration (resume is a static PDF/image instead of generated HTML from `cv.yaml`, or its content drifts from it) | −10 | Violates the single-source-of-truth requirement. |
| Needless microservices (splitting into multiple deployable services without a concrete reason tied to the goals) | −10 | Complexity must be justified. |
| Vendor lock-in (static site or Replay mode requires a specific paid host/vendor SDK to function) | −10 | Violates static-first/portability intent. |
| Tests that depend on live inference (unit/integration tests call the real Groq API) | −10 | Violates provider-neutral testing; breaks CI without secrets. |
| Exposed secrets (any API key path to browser/client bundle/`NEXT_PUBLIC_*`-style var, or a real secret committed) | −25 | Severe: security-critical. |
| Blocks GitHub Pages static export (server-only rendering required, dynamic routing that breaks at the domain root, hardcoded non-root basePath) | −20 | Severe: violates the core deployment constraint. |
| Fabricated facts (any claim, metric, or integration not present in `content/source/cv.yaml` or clearly marked as synthetic demo content) | −25 | Severe: violates factual-integrity invariant. |

## Process notes

- Judges score independently, without reading other judges' notes or other
  proposals' scores, and record their reasoning in `docs/judgements/`.
- A proposal that violates any single item in `docs/hard-constraints.md` should
  have its judgement note explicitly flag the violation, in addition to any
  rubric penalty applied above.
- The synthesizer may select a single proposal, or merge the strongest
  elements of several, but must record the rationale as an ADR in `docs/adr/`.
