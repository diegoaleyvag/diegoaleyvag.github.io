import type { DecisionStatus } from "@portfolio/decisions";
import type { Lang } from "../../lib/i18n";

export interface MapCopy {
  readonly eyebrow: string;
  readonly instructions: string;
  readonly fallbackSummary: string;
  readonly domainsGroupLabel: string;
  readonly decisionsGroupLabel: string;
  readonly panelDefaultHeading: string;
  readonly panelDefaultBody: string;
  readonly connectsToLabel: string;
  readonly noConnectionsYetLabel: string;
  readonly buildingLabel: string;
  readonly plannedLabel: string;
  readonly selectionClearedAnnouncement: string;
}

const MAP_COPY: Record<Lang, MapCopy> = {
  en: {
    eyebrow: "Where the work lives",
    instructions:
      "Select a domain or a decision to see how it connects. Tab through the map, then press Enter or Space.",
    fallbackSummary: "Read the connections as a list",
    domainsGroupLabel: "Domains",
    decisionsGroupLabel: "Five Decisions",
    panelDefaultHeading: "Nothing selected yet",
    panelDefaultBody:
      "Choose a domain to see which decisions draw on it, or a decision to see which domains it spans.",
    connectsToLabel: "Connects to",
    noConnectionsYetLabel: "No decision connects here yet.",
    buildingLabel: "Building",
    plannedLabel: "Planned",
    selectionClearedAnnouncement: "Selection cleared.",
  },
  es: {
    eyebrow: "Donde vive el trabajo",
    instructions:
      "Elige un dominio o una decisión para ver cómo se conectan. Recorre el mapa con Tab y presiona Enter o espacio.",
    fallbackSummary: "Leer las conexiones como lista",
    domainsGroupLabel: "Dominios",
    decisionsGroupLabel: "Five Decisions",
    panelDefaultHeading: "Nada seleccionado todavía",
    panelDefaultBody:
      "Elige un dominio para ver qué decisiones lo usan, o una decisión para ver qué dominios abarca.",
    connectsToLabel: "Se conecta con",
    noConnectionsYetLabel: "Todavía ninguna decisión se conecta aquí.",
    buildingLabel: "En construcción",
    plannedLabel: "Planeada",
    selectionClearedAnnouncement: "Selección borrada.",
  },
};

export function mapCopyFor(lang: Lang): MapCopy {
  return MAP_COPY[lang];
}

export function statusLabel(copy: MapCopy, status: DecisionStatus): string {
  if (status === "building") {
    return copy.buildingLabel;
  }
  if (status === "planned") {
    return copy.plannedLabel;
  }
  return status;
}

export function describeDomainSelection(
  lang: Lang,
  domainLabel: string,
  decisionLabels: readonly string[],
): string {
  if (lang === "es") {
    if (decisionLabels.length === 0) {
      return `Dominio seleccionado: ${domainLabel}. Todavía ninguna decisión está conectada.`;
    }
    return `Dominio seleccionado: ${domainLabel}. Se conecta con ${decisionLabels.join(" y ")}.`;
  }
  if (decisionLabels.length === 0) {
    return `Selected the ${domainLabel} domain. No decisions are linked to it yet.`;
  }
  return `Selected the ${domainLabel} domain. Connects to ${decisionLabels.join(" and ")}.`;
}

export function describeDecisionSelection(
  lang: Lang,
  copy: MapCopy,
  decisionLabel: string,
  status: DecisionStatus,
  domainLabels: readonly string[],
): string {
  const statusWord = statusLabel(copy, status);
  if (lang === "es") {
    return `Decisión seleccionada: ${decisionLabel}, ${statusWord.toLowerCase()}. Abarca ${domainLabels.join(" y ")}.`;
  }
  return `Selected ${decisionLabel}, ${statusWord.toLowerCase()}. Spans ${domainLabels.join(" and ")}.`;
}
