/**
 * Reviewed allowlist of neutral interface copy for the site shell, home page,
 * and 404 page. These strings are navigation/UI labels only — never CV facts.
 * Factual values always come from `@portfolio/resume` via typed source paths.
 */

export const SITE_SHELL_COPY = {
  skipToContent: "Skip to main content",
  primaryNavigationLabel: "Primary",
  footerNavigationLabel: "Footer",
  homeLinkLabel: "Home",
  portfolioLink: "Portfolio",
  resumeLink: "Résumé",
  askLink: "Ask Diego",
  footerNote: "Static build, prerendered end to end.",
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
} as const;
