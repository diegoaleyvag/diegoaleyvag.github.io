# Architecture Proposal: Gemini

## 1. Product Thesis, Target Audience, and Differentiation

**Thesis:** The portfolio is not just a display of past work; it is a live, verifiable proof of engineering competence. By implementing a clean-room agent governance platform that governs its own interactive demo, the portfolio demonstrates deep expertise in identity, policy, and observability without relying on proprietary IP.

**Target Audience:**
- **Recruiters:** Need immediate clarity. They will find a fast-loading, distinctive landing page and a semantically structured HTML resume that is easy to parse and read.
- **Engineers:** Need technical depth. They will find a robust, static-first architecture, a zero-backend Replay mode, and a clean-room implementation of W3C DIDs, OPA/Rego, and Merkle audits.

**Differentiation:** We explicitly reject the generic "AI landing page" aesthetic (no purple gradients, floating glass, or fake terminals). Instead, the design is grounded, data-dense, and transparent. It is a "show, don't tell" platform where the technical constraints (static-first, zero secrets in browser) are treated as architectural features.

## 2. Information Architecture and Route Map

The site is a statically exported application served at the domain root (`/`).

- **`/` (Home):** Diego's narrative, high-level summary, and the entry point to the interactive governance demo.
- **`/resume`:** The HTML resume, deterministically generated from `content/source/cv.yaml`.
- **`/demo`:** The interactive agent governance demo. Defaults to Replay mode (zero backend).
- **`/architecture`:** Technical documentation explaining the clean-room implementation of DIDs, OPA, Merkle trees, and OpenTelemetry.

## 3. Portfolio Narrative

The narrative is strictly grounded in `content/source/cv.yaml`. It tells the story of a final-year BSc Data Science student at ESCOM (IPN) who bridges the gap between academic data science and enterprise AI engineering.

Key narrative beats:
- **The Foundation:** High academic achievement (9.29/10 GPA) and international exposure (Queen Mary University of London).
- **The Enterprise Reality:** Hands-on experience at Infosys building real agent governance frameworks, culminating in a 3rd place finish at the InStep Project Fest and a presentation to N. R. Narayana Murthy.
- **The Builder:** Demonstrable project leadership in cross-disciplinary teams (FridgeGuard) and practical RAG implementations (Nutritional Assistant).

## 4. Three Coherent Visual Directions

To avoid generic AI aesthetics, we propose three distinct visual directions:

1. **Editorial / Print-Inspired:** Focuses on high-contrast typography. Uses serif headers, clean sans-serif body text, off-white backgrounds, and stark black text with subtle grid lines. It evokes the permanence and authority of a printed academic journal or technical paper.
2. **Technical Blueprint:** Uses monospace accents, a blueprint blue/white color palette, and visible structural borders. Layouts are data-dense but highly structured. It evokes engineering precision and architectural drafting.
3. **Minimalist Archival:** A museum-like presentation using warm grayscale and abundant whitespace. Projects and technical artifacts are displayed with muted accent colors (e.g., a single terracotta or sage green for interactive elements). It emphasizes clarity and focus.

## 5. The Static/Live Boundary

- **Static (The Default):** The entire UI, the HTML resume, and the Replay mode JSON traces are fully static. The site is built as a static bundle and served from GitHub Pages. It requires zero backend to function.
- **Live (The Optional Extension):** A separate, independently deployable backend service (e.g., a serverless function or lightweight container) handles Live-Groq inference. The frontend detects the presence of a configured backend URL (via a build-time environment variable). If absent, the UI gracefully locks to Replay mode.

## 6. Local Dev Architecture and Repository/Module Structure

We propose a monorepo structure using a fast package manager (e.g., `pnpm` for a TypeScript-heavy stack or `uv` if the backend is Python).

```text
/
├── apps/
│   ├── web/                 # Static site (Astro or Next.js Static Export)
│   └── api/                 # Optional live-inference backend (FastAPI or Hono)
├── packages/
│   ├── core/                # Shared domain models, provider interfaces, policy logic
│   └── resume-builder/      # CLI tool to parse cv.yaml -> HTML/PDF
├── content/
│   └── source/cv.yaml       # The canonical source of truth
├── docs/                    # Architecture docs, ADRs, proposals
└── .github/workflows/       # CI/CD pipelines
```

## 7. Resume: cv.yaml -> HTML (+ PDF) Strategy

- **HTML:** A build script in `packages/resume-builder` parses `cv.yaml` and provides it as strongly-typed data to the frontend framework (e.g., Astro collections or Next.js data fetching). The HTML is generated at build time, ensuring semantic markup and responsive design.
- **PDF:** We will reuse the existing Typst-style pipeline for PDF generation. Typst is exceptionally fast, deterministic, and designed for print-perfect layouts. Generating the PDF via Typst and the HTML via the web framework allows each medium to play to its strengths, rather than compromising with a suboptimal HTML-to-PDF print script.

## 8. Provider Abstraction and Secret-Handling Boundaries

The core abstraction is a single interface: `execute_agent(intent, context) -> Trace`.

- **Fake Provider:** Returns hardcoded, deterministic responses based on input hashes. Used exclusively for unit and integration tests.
- **Replay Provider:** Loads pre-recorded `Trace` objects from static JSON files based on interaction IDs. Powers the zero-backend demo.
- **Live Provider (Groq):** Calls the Groq API. Reads rate limits from response headers.
- **Secret Boundary:** The frontend *never* possesses the Groq API key. Secrets exist only in the optional backend's environment variables. The frontend only communicates with the backend via a public endpoint.

## 9. Domain Model

- **Agent:** Defined by a W3C DID (Identity) and a set of capabilities.
- **Tool:** An executable action with a defined schema.
- **Policy:** OPA/Rego rules defining permissible actions for an Agent.
- **Trace:** An OpenTelemetry-compatible record of the execution flow.
- **Evaluation:** A Merkle-tree audit of the trace, proving that the execution complied with the defined policies.

## 10. API Contracts and Threat Model

**API Contract (Optional Backend):**
- `POST /api/execute`
  - Request: `{ "intent": string, "context": object }`
  - Response: `{ "trace": TraceObject, "audit_proof": MerkleProof }`

**Threat Model:**
- **Frontend:** Completely static. No secrets to leak. XSS mitigated by strict framework escaping.
- **Backend:** Must validate all inputs (e.g., using Pydantic or Zod). Must not allow arbitrary code execution. Rate limiting is enforced based on Groq's headers to prevent abuse.
- **Data:** All data is synthetic. No PII is processed or stored.

## 11. Test Pyramid and Deterministic Evaluation Strategy

- **Unit Tests:** Test policy logic, DID generation, and Merkle tree construction using the Fake provider.
- **Integration Tests:** Test the optional backend API endpoints using the Fake provider.
- **E2E Tests:** Playwright tests run against the static site using the Replay provider.
- **Evaluation Strategy:** Normal CI tests *never* call the Live Groq API. A separate, manually triggered script can be used to generate new Replay traces using the Live provider, which are then committed to the repository.

## 12. GitHub Pages Static Deployment Plan

The static site will be deployed to `diegoaleyvag.github.io` via GitHub Actions.
- **Gotchas:** We must include a `.nojekyll` file in the build output to prevent GitHub Pages from ignoring folders that start with an underscore (e.g., `_astro` or `_next`).
- **Routing:** The framework must be configured for a root `basePath` (`/`) and must support static client-side routing.

## 13. Optional Backend Deployment Plan

The optional backend can be deployed as a lightweight container (e.g., on Render or Fly.io) or as a serverless function (e.g., Vercel or Cloudflare Workers). The frontend is configured with the backend URL at build time. If the URL is not provided, the frontend defaults to Replay mode.

## 14. Accessibility and Performance Requirements

- **Accessibility:** WCAG 2.1 AA compliance is mandatory. The HTML resume must use semantic tags (`<article>`, `<section>`, `<h1>`-`<h6>`). The interactive demo must be fully keyboard navigable.
- **Performance:** Target Lighthouse scores of >95 across all categories. Zero Cumulative Layout Shift (CLS). The static site must ship minimal JavaScript.

## 15. Smallest Credible Vertical Slice Shippable Tonight

A single, statically exported page containing:
1. The HTML resume generated from `cv.yaml`.
2. A hardcoded, read-only view of a single Replay-mode trace, displaying a synthetic Agent DID, a simple Policy evaluation, and a Merkle root.
3. Deployed successfully to GitHub Pages.

## 16. Explicit Non-Goals for Tonight

- Live Groq API integration.
- Full OPA/Rego evaluation engine implementation (we will mock the policy result for the vertical slice).
- PDF generation pipeline integration.

## 17. Parallel Implementation Task DAG

- **Track A (Frontend):** Setup the static site framework, implement the chosen visual direction, and build the resume component driven by `cv.yaml`.
- **Track B (Core Domain):** Define the data models (Agent, Trace, Policy) and implement the Fake and Replay providers.
- **Track C (DevOps):** Configure the GitHub Actions workflow for the static GitHub Pages deployment, ensuring `.nojekyll` is present.

## 18. Risks, Trade-offs, Rejected Alternatives, and ADRs

- **Risk:** Replay traces become desynchronized with frontend expectations. *Mitigation:* Version the trace schema and validate Replay JSON files at build time.
- **Rejected Alternative:** A Single Page Application (SPA) that calls Groq directly from the client. *Reason:* Violates the hard constraint against secrets in the browser.
- **Rejected Alternative:** Server-Side Rendering (SSR) for the main site. *Reason:* Violates the hard constraint that the site must be a static bundle deployable to GitHub Pages.
- **ADRs to Create:**
  - ADR-001: Frontend Framework Selection (e.g., Astro vs. Next.js Static).
  - ADR-002: Provider Abstraction and Trace Schema Design.
  - ADR-003: Resume HTML and PDF Generation Strategy.

## 19. Naming Criteria and Collision-Risk Notes

- **Criteria:** The project name should be professional, understated, and hint at concepts of governance, reliability, or auditing.
- **Collision-Risk:** We must strictly avoid trademarked Infosys terms or generic AI buzzwords (e.g., "AutoGPT", "AgenticX", "AI-Governance-Platform").
- *(No final name is committed in this proposal.)*
