/**
 * Bilingual route map and shared UI copy. Every route required in English
 * has a Spanish counterpart at its `/es/` path (frontend.mdc); this module
 * is the single place that pairs them up, so a page and its language
 * switcher can never point at two different route shapes by accident.
 */
export type Lang = "en" | "es";

export interface RoutePair {
  readonly en: string;
  readonly es: string;
}

export const ROUTES = {
  home: { en: "/", es: "/es/" },
  work: { en: "/work/", es: "/es/trabajo/" },
  resume: { en: "/resume/", es: "/es/cv/" },
  archive: { en: "/archive/", es: "/es/archivo/" },
  governanceLab: {
    en: "/work/governance-lab/",
    es: "/es/trabajo/governance-lab/",
  },
  // Ask Diego is a sibling workstream building in a different worktree
  // (apps/site/src/pages/api/ask.ts, /ask/, /es/pregunta/). These are
  // forward references only: the nav/CTA links below point at the routes
  // that workstream will create, and a local build 404ing on them today is
  // expected, not a bug.
  ask: { en: "/ask/", es: "/es/pregunta/" },
} as const satisfies Record<string, RoutePair>;

export function workDecisionPath(lang: Lang, id: string): string {
  return lang === "en" ? `/work/${id}/` : `/es/trabajo/${id}/`;
}

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

const NAV_COPY: Record<
  Lang,
  { home: string; work: string; resume: string; ask: string }
> = {
  en: { home: "Home", work: "Work", resume: "Résumé", ask: "Ask the guide" },
  es: {
    home: "Inicio",
    work: "Trabajo",
    resume: "CV",
    ask: "Pregúntale a la guía",
  },
};

export function primaryNav(lang: Lang): readonly NavLink[] {
  const copy = NAV_COPY[lang];
  return [
    { href: ROUTES.home[lang], label: copy.home },
    { href: ROUTES.work[lang], label: copy.work },
    { href: ROUTES.resume[lang], label: copy.resume },
    { href: ROUTES.ask[lang], label: copy.ask },
  ];
}

export const SHELL_COPY: Record<
  Lang,
  {
    skipToContent: string;
    primaryNavigationLabel: string;
    footerNavigationLabel: string;
    homeLinkLabel: string;
    footerNote: string;
    langSwitcherLabel: string;
    langNames: { en: string; es: string };
  }
> = {
  en: {
    skipToContent: "Skip to main content",
    primaryNavigationLabel: "Primary",
    footerNavigationLabel: "Footer",
    homeLinkLabel: "Home",
    footerNote: "Static build, prerendered end to end.",
    langSwitcherLabel: "Language",
    langNames: { en: "EN", es: "ES" },
  },
  es: {
    skipToContent: "Saltar al contenido principal",
    primaryNavigationLabel: "Principal",
    footerNavigationLabel: "Pie de página",
    homeLinkLabel: "Inicio",
    footerNote: "Sitio estático, generado por completo antes de publicarse.",
    langSwitcherLabel: "Idioma",
    langNames: { en: "EN", es: "ES" },
  },
};

export const HERO_CTA_COPY: Record<
  Lang,
  { primary: string; secondary: string }
> = {
  en: { primary: "Explore my work", secondary: "Ask the guide" },
  es: { primary: "Explorar mi trabajo", secondary: "Pregúntale a la guía" },
};

export const SECTION_COPY: Record<
  Lang,
  {
    decisionsHeading: string;
    decisionsIntro: string;
    selectedWorkHeading: string;
    selectedWorkIntro: string;
    workIndexCta: string;
    governanceLabLabel: string;
    governanceLabNote: string;
    archiveCta: string;
    aboutPhotoAlt: string;
    contactEmailLabel: string;
    contactLinkedinLabel: string;
    contactGithubLabel: string;
    viewCase: string;
    resumeCta: string;
    downloadPdf: string;
    viewTranscription: string;
  }
> = {
  en: {
    decisionsHeading: "Five Decisions",
    decisionsIntro:
      "All five decisions are verified. Status here always comes from each decision's own manifest.",
    selectedWorkHeading: "Selected work",
    selectedWorkIntro:
      "The full collection, a smaller secondary case, and the earlier academic record it grew out of.",
    workIndexCta: "See all of Work",
    governanceLabLabel: "Personal Governance Lab",
    governanceLabNote:
      "A secondary case — not published yet, an honest placeholder.",
    archiveCta: "Academic archive",
    aboutPhotoAlt: "Diego Leyva",
    contactEmailLabel: "Email",
    contactLinkedinLabel: "LinkedIn",
    contactGithubLabel: "GitHub",
    viewCase: "View case",
    resumeCta: "View the full résumé",
    downloadPdf: "Download the PDF",
    viewTranscription: "Read the HTML transcription",
  },
  es: {
    decisionsHeading: "Five Decisions",
    decisionsIntro:
      "Las cinco decisiones están verificadas. El estado aquí siempre viene del propio manifiesto de cada decisión.",
    selectedWorkHeading: "Trabajo seleccionado",
    selectedWorkIntro:
      "La colección completa, un caso secundario más pequeño, y el registro académico anterior del que surgió.",
    workIndexCta: "Ver todo el trabajo",
    governanceLabLabel: "Personal Governance Lab",
    governanceLabNote:
      "Un caso secundario — todavía no publicado, un placeholder honesto.",
    archiveCta: "Archivo académico",
    aboutPhotoAlt: "Diego Leyva",
    contactEmailLabel: "Correo",
    contactLinkedinLabel: "LinkedIn",
    contactGithubLabel: "GitHub",
    viewCase: "Ver caso",
    resumeCta: "Ver el currículum completo",
    downloadPdf: "Descargar el PDF",
    viewTranscription: "Leer la transcripción en HTML",
  },
};

export const NOT_FOUND_COPY: Record<
  Lang,
  { documentTitle: string; heading: string; body: string }
> = {
  en: {
    documentTitle: "Page not found",
    heading: "Page not found",
    body: "There is no page at this address. Use the links below to continue.",
  },
  es: {
    documentTitle: "Página no encontrada",
    heading: "Página no encontrada",
    body: "No hay ninguna página en esta dirección. Usa los siguientes enlaces para continuar.",
  },
};
