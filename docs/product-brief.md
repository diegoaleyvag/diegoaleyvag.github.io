# Product brief

Status: **Canonical**

## Thesis

Build one portfolio with two reading depths and one governing principle:
**claims should lead to inspectable evidence**.

The fast path gives recruiters Diego's source-grounded profile, selected work,
complete HTML résumé, and contact links. The depth path gives engineers a
clean-room, synthetic governed-run lab whose policy input, decision, event
sequence, deterministic assertions, and audit mechanics can be inspected.

The parallel is editorial, not cryptographic. Portfolio facts trace to exact
paths in `content/source/cv.yaml`; synthetic run events trace to a versioned
`RunBundle`. Merkle evidence applies only to the synthetic demo and does not
verify résumé claims.

## Audience

### Recruiters and hiring managers

They need to answer, without learning the demo architecture:

- who Diego is and which roles he seeks;
- what education, experience, projects, and skills are present in the canonical
  CV;
- where to read or print the full HTML résumé;
- how to contact him using source-provided links.

The home page must remain useful with JavaScript disabled. The lab is an
invitation, never a prerequisite for understanding the candidate.

### Engineers and technical interviewers

They need evidence of engineering judgment:

- explicit module and trust boundaries;
- a versioned cross-boundary data contract;
- real, public Rego policy evaluated against synthetic inputs;
- allow and deny behavior with event-order invariants;
- deterministic, network-free tests;
- honest Merkle claim limits;
- a clean separation between static Replay and optional Live inference.

## Product promise

The site presents source facts without upgrading them and demonstrates, in a
new clean-room project, how a synthetic agent action can be identified,
policy-gated, recorded, evaluated, and checked for tampering.

It does not claim that:

- a résumé statement is cryptographically verified;
- the demo reproduces an employer system;
- a Merkle root proves truth or policy compliance;
- Replay is Live execution;
- the public browser is a trusted environment.

## Differentiation

The memorable device is an **editorial evidence ledger**, not AI spectacle.
Factual source paths, policy rules, event order, and evidence status determine
the visual hierarchy. Denial and tamper failure are first-class outcomes rather
than hidden edge cases.

The product deliberately avoids:

- a generic oversized AI slogan;
- purple/blue gradients, glass panels, glow, particles, or robot imagery;
- fake terminals, fake typing, and fabricated dashboards;
- decorative extraction of CV numbers into “impact” counters;
- an open chatbot that conceals governance behind an animation;
- unsupported case-study narratives;
- a résumé embedded as a PDF or maintained separately from `cv.yaml`.

## Experience sequence

1. **Profile:** source name, headline, availability, summary, and contact paths.
2. **Selected work:** exact source entries arranged for scanning, never
   paraphrased into inferred case studies.
3. **Governed run:** a visibly synthetic Replay scenario with allow and deny
   variants.
4. **Evidence:** policy input/output, ordered events, deterministic assertions,
   and a narrowly worded integrity check.
5. **Complete record:** the semantic HTML résumé, generated from every
   publishable CV leaf.

## First-release scope

The first release includes the static portfolio, complete HTML résumé,
Replay-only lab, public-source and clean-room explanation, and root-domain
GitHub Pages deployment.

It excludes public Live inference, arbitrary visitor input, a database, user
accounts, analytics, broad DID/VC compatibility, real tools or side effects,
and rich project case studies unsupported by the canonical source.

## Product success conditions

- A recruiter can understand the profile and reach the résumé without using the
  Replay interface.
- An engineer can inspect one real policy allow, one real policy deny, ordered
  events, and a tamper-failing proof without a backend.
- Every factual string can be traced to `cv.yaml`; every new demo datum is
  visibly synthetic.
- The static artifact works at `https://diegoaleyvag.github.io/` with no secret
  or runtime.
- The interface states what its evidence does and does not establish.
