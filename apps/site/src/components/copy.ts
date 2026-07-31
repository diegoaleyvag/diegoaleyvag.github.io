/**
 * Reviewed allowlist of neutral interface copy for the site shell, home page,
 * and 404 page. These strings are navigation/UI labels and pre-approved
 * product copy (see docs/portfolio-narrative.md section 3) — never CV facts.
 * Factual values always come from `@portfolio/resume` via typed source paths.
 */

export const SITE_SHELL_COPY = {
  skipToContent: "Skip to main content",
  primaryNavigationLabel: "Primary",
  footerNavigationLabel: "Footer",
  portfolioLink: "Portfolio",
  resumeLink: "Résumé",
  labLink: "Synthetic lab",
  footerNote: "Static build. Replay runs entirely from checked-in files.",
} as const;

export const NOT_FOUND_COPY = {
  documentTitle: "Page not found",
  heading: "Page not found",
  body: "There is no page at this address. Use the links below to continue.",
} as const;

export const HOME_COPY = {
  resumeCta: "View the complete résumé",
  evidenceHeading: "Selected evidence",
  categoryExperience: "Experience",
  categoryProject: "Project",
  categoryEducation: "Education",
  skillsHeading: "Skills",
  skillsNote: "Every skill and certification is listed in full on the résumé.",
  labHeading: "Synthetic lab",
  // Verbatim product copy from docs/portfolio-narrative.md section 3.
  labIntroA:
    "A synthetic, clean-room portfolio demonstration built from public specifications.",
  labIntroB:
    "Replay uses checked-in synthetic runs and works without a backend. It shows recorded policy decisions and demonstrates event tamper detection relative to each bundle's included Merkle root.",
  labCta: "Inspect the synthetic lab",
} as const;
