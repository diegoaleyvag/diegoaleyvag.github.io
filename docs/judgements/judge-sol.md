# Blind architecture judgement

## Verdict

**Recommended base: Candidate A.**

Candidate A is the only proposal that is simultaneously distinctive, technically
precise, static-first, honest about what cryptographic evidence proves, and
explicitly safe against real-data submission. Its main weakness is an
over-ambitious first-night scope, not an architectural or compliance failure.

## Scoring matrix

| Criterion                             |     Max |      A |       B |       C |
| ------------------------------------- | ------: | -----: | ------: | ------: |
| Portfolio distinctiveness & narrative |      15 |     15 |      13 |       8 |
| Technical credibility & depth         |      15 |     15 |      11 |       6 |
| Static/live architecture quality      |      15 |     15 |      13 |      10 |
| MVP feasibility tonight               |      10 |      7 |       7 |       9 |
| Agent-governance & evaluation design  |      15 |     15 |      12 |       5 |
| Maintainability & testing             |      10 |      9 |       8 |       5 |
| Security & clean-room compliance      |      15 |     15 |       7 |       7 |
| Deployment simplicity                 |       5 |      5 |       5 |       3 |
| **Pre-penalty subtotal**              | **100** | **96** |  **76** |  **53** |
| Generic AI aesthetics                 |     −10 |      0 |       0 |       0 |
| Resume-as-decoration                  |     −10 |      0 |       0 |       0 |
| Needless microservices                |     −10 |      0 |       0 |       0 |
| Vendor lock-in                        |     −10 |      0 |       0 |       0 |
| Tests that depend on live inference   |     −10 |      0 | **−10** |       0 |
| Exposed secrets                       |     −25 |      0 |       0 |       0 |
| Blocks GitHub Pages static export     |     −20 |      0 |       0 |       0 |
| Fabricated facts                      |     −25 |      0 | **−25** | **−25** |
| **Final score**                       |         | **96** |  **41** |  **28** |

### Candidate A — 96

- **Distinctiveness (15/15):** The two-speed recruiter/engineer experience and
  evidence-ledger narrative form one memorable product rather than a résumé
  wrapped around a dashboard.
- **Technical credibility (15/15):** The proposal specifies state invariants,
  approval binding, canonical audit construction, telemetry minimization,
  provider error normalization, and—critically—the limits of same-origin Merkle
  verification.
- **Static/live architecture (15/15):** Replay is complete static data; Live is
  removable; callers see one provider port; the site remains functional without
  a runtime URL.
- **MVP feasibility (7/10):** The slice is coherent, but three scenario variants,
  real Rego generation, résumé coverage, browser proof verification,
  accessibility, Playwright, and Pages deployment are too much for one evening
  without trimming.
- **Governance/evaluation (15/15):** Identity, credentials, policy, approval,
  tools, events, traces, evidence, and deterministic assertions form a real
  domain model grounded in public specifications.
- **Maintainability/testing (9/10):** Ownership and tests are exceptionally
  concrete. The deduction is for the number of packages, generated artifacts,
  dual résumé paths, and native/WASM parity surface.
- **Security/clean-room (15/15):** It has the strongest provenance boundary,
  omission rule, telemetry allowlist, server-only key flow, and synthetic-only
  enforcement. The Live API accepts only a scenario ID and finite variant.
- **Deployment (5/5):** It names the exact root-site repository, emits physical
  routes, uses no request-time server behavior, and tests the artifact at `/`.
- **Penalties:** None.

### Candidate B — 41

- **Distinctiveness (13/15):** The recursive “portfolio as governed artifact”
  and dossier direction are memorable, though they risk turning the person into
  a cryptographic exhibit.
- **Technical credibility (11/15):** The Run JSON contract and cross-language
  verifier are strong. The claim that same-origin signatures and roots require
  “no trust in the server” is false without an independently trusted key/root.
- **Static/live architecture (13/15):** The static Replay boundary and three
  providers are clear. The broad `params` object, stored-run endpoint, and mixed
  full-response/SSE contract make Live less disciplined than Replay.
- **MVP feasibility (7/10):** A generated résumé, signed fixture, browser
  cryptography, interactive island, and tests are plausible only with careful
  trimming. Deferring deployment CI and provenance enforcement weakens the
  promised end-to-end proof.
- **Governance/evaluation (12/15):** The entities and deterministic scenario
  assertions are substantive, but Replay displays rather than re-evaluates Rego,
  approval binding is underspecified, and evidence authenticity is overstated.
- **Maintainability/testing (8/10):** Boundaries and contract tests are good, but
  the two-language toolchain is costly for the scope and the proposal explicitly
  adds a real-provider test suite.
- **Security/clean-room (7/15):** Secrets are correctly server-side and the
  clean-room intent is explicit. However, `POST /api/runs` accepts
  `params?: object`, so the architecture cannot enforce its claim that all
  submitted data is synthetic.
- **Deployment (5/5):** The root Pages configuration, physical output, and
  independently portable runtime are concrete.
- **Penalty—live-dependent tests (−10):** `tests/live/` and `just test-live`
  explicitly call real Groq. Quarantining them from CI does not make them
  provider-neutral tests; transport fixtures should test the adapter instead.
- **Penalty—fabricated facts (−25):** “Built agent-governance infrastructure at
  production scale” is an unsupported upgrade of the later source-attributed
  internship facts. The proposal supplies no canonical source path for
  “production scale.”

### Candidate C — 28

- **Distinctiveness (8/15):** It rejects cliché AI styling, but its three
  directions and narrative remain broad portfolio archetypes rather than one
  selected, memorable system.
- **Technical credibility (6/15):** Most decisions remain alternatives
  (`Astro or Next.js`, `FastAPI or Hono`). More seriously, a Merkle tree proves
  integrity relative to a root; it does not prove policy compliance.
- **Static/live architecture (10/15):** The high-level split is workable and all
  three providers are named, but the provider interface conflates orchestration
  with inference, configuration-only swapping is not specified, and physical
  Pages routing is unresolved.
- **MVP feasibility (9/10):** One generated résumé, one read-only trace, and a
  Pages deployment are realistic tonight. It loses one point because a mocked
  policy result barely proves the proposed governance architecture.
- **Governance/evaluation (5/15):** DIDs, Rego, traces, and Merkle trees are
  listed, but there is no approval model, state machine, evidence contract, or
  deterministic compliance assertion design.
- **Maintainability/testing (5/10):** There is a reasonable skeleton and
  network-free test pyramid, but no versioned cross-boundary contract or settled
  stack/module ownership.
- **Security/clean-room (7/15):** The key boundary and synthetic-data statement
  are correct in prose. The public API nevertheless accepts arbitrary `intent`
  and `context`, allowing real PII and unbounded prompt content.
- **Deployment (3/5):** Static Pages and `.nojekyll` are stated, but the exact
  `diegoaleyvag/diegoaleyvag.github.io` repository, physical route output, and
  no-rewrite deep-link behavior are not specified.
- **Penalty—fabricated facts (−25):** The narrative introduces inferred
  descriptors such as “final-year,” “Enterprise Reality,” and “building real
  agent governance frameworks” without exact-source rendering or a provenance
  safeguard. Its “live, verifiable proof” thesis also conflicts with its own
  static mocked MVP and deferred Live runtime.

## Hard-constraint violations and fatal flaws

### Candidate A

No fatal hard-constraint violation identified. The first-night scope is the one
material risk: if treated as a fixed checklist, it could produce several
half-finished subsystems. That is an execution risk and should be corrected by
scope reduction.

### Candidate B

1. **Factual integrity:** the unsupported “production scale” claim is
   disqualifying until removed.
2. **Synthetic-only:** the arbitrary `params` input permits real data despite
   the proposal's synthetic-data declaration.
3. **Evidence semantics:** a public key, signature, bundle, and root delivered
   by one origin do not eliminate trust in that origin.
4. **Provider-neutral testing:** a real-Groq test suite violates the explicit
   no-live-inference testing rule even when manually gated.

### Candidate C

1. **Factual integrity:** its narrative adds inferred qualifications rather
   than limiting production copy to canonical source values.
2. **Synthetic-only:** `{ intent: string, context: object }` is an unrestricted
   real-data and prompt-injection path.
3. **Governance correctness:** Merkle integrity is incorrectly described as
   proof that execution complied with policy.
4. **Provider/runtime contract:** configuration-only provider interchangeability
   is asserted only implicitly, and inbound abuse controls are confused with
   Groq's account-level response headers.
5. **Root Pages target:** the exact repository and physical deep-link strategy
   are not committed.

## Pairwise comparisons

### A vs B

A wins on factual discipline, synthetic-only enforcement, proof semantics,
single-language simplicity, and first-class static artifact checks. B's Run JSON
contract is excellent, but B undermines it by overstating what browser
verification establishes and by allowing arbitrary Live parameters. B also
incurs two explicit penalties that A avoids.

### A vs C

A turns every named public concept into a bounded domain object, invariant, and
test; C mostly names the concepts. C has the more feasible first-night scope,
which A should borrow, but C's mocked policy result cannot support its claim of
a verifiable governance showcase. A is also materially safer at the Live API
boundary.

### B vs C

B is substantially stronger before penalties: it has a real contract,
cross-language verification, deterministic scenarios, concrete Pages output,
and a credible module structure. C is easier to start but leaves central choices
open and misunderstands audit evidence. B still finishes only modestly ahead
after its live-test and fabricated-fact penalties.

## Best single decision from each candidate

- **A:** Restrict Live requests to a versioned synthetic scenario ID and finite
  variant, with the server constructing all prompts and tool inputs.
- **B:** Make one versioned Run JSON artifact the contract shared by generation,
  Replay rendering, verification, and deterministic tests.
- **C:** Reduce the first-night product to a generated HTML résumé, one bounded
  Replay scenario, and a proven root-domain Pages deployment.

## Recommended base proposal

Use **Candidate A** as the base. Preserve its evidence-first narrative, immutable
CV boundary, public-source ledger, versioned RunBundle, constrained Live API,
single optional runtime, honest Merkle wording, deterministic evaluation model,
and physical root Pages routes.

The one mandatory edit before implementation is to cut its tonight scope. Ship
one scenario with allow and deny outcomes, one real policy decision, one event
ordering invariant, and one tamper-failing Merkle proof. Approval, VC signature
verification, Live, multiple work pages, and native/WASM parity can follow.

## Decisions that should be combined

1. **A's architecture + C's scope discipline:** retain A's real build-time
   policy/evidence path, but demonstrate it with one small scenario tonight.
2. **A's RunBundle + B's contract-test framing:** use one versioned artifact
   across generator, static UI, and tests; mutate one event and require every
   verifier to reject it.
3. **A's honest trust wording + B's browser verification:** keep local
   recomputation, but label it as integrity-mechanism demonstration unless an
   independent release key/root is introduced.
4. **A's editorial evidence ledger + B's data-ink discipline:** provenance,
   state, and evidence may drive visual marks; CV metrics must never become
   decorative counters.
5. **A's constrained Live seam + C's default Replay posture:** do not deploy
   Live in the first slice, but keep its server-only contract explicit.

## Decisions that must not be combined

1. Do not combine A's factual boundary with B's “production scale” claim or C's
   inferred résumé narrative.
2. Do not combine browser verification with claims that the serving origin is
   no longer trusted.
3. Do not combine A's finite synthetic request schema with B's arbitrary
   `params` or C's arbitrary `intent/context` API.
4. Do not add B's real-Groq tests; use mocked HTTP transport and keep any manual
   live exercise explicitly outside the test/evaluation system.
5. Do not mix A's all-TypeScript runtime decision with B's Python runtime merely
   to “match the CV.” Choose one runtime stack on maintainability evidence.
6. Do not combine C's mocked policy output with UI language implying policy was
   executed or compliance was proved.
7. Do not implement all visual themes, both runtime stacks, multiple route
   families, and Live during the first-night slice.

## Five hardest questions for the synthesizer

1. What is the smallest first-night scenario that executes a real policy and
   demonstrates both denial and tamper detection without becoming scaffolding?
2. Is an all-TypeScript runtime materially simpler than a Python runtime here,
   and is any CV-alignment benefit worth a second language and generated types?
3. Which production strings may be editorially sequenced or shortened, and what
   build rule proves that no résumé fact was inferred, upgraded, or dropped?
4. What exact claim may the browser make when the bundle, Merkle root,
   signature, and verification key arrive from the same GitHub Pages origin?
5. Should public Live exist at all in the first release; if later enabled, what
   finite request schema, spend controls, kill switch, and manual diagnostics
   make the residual abuse risk acceptable?
