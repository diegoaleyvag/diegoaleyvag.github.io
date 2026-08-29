import { parseDocument } from "yaml";

import { readRepositoryFile } from "./repo";
import type { Lang } from "./i18n";

function parseYaml(source: string, label: string): unknown {
  const document = parseDocument(source, {
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
  });
  if (document.errors.length > 0) {
    throw new Error(`${label} YAML parsing failed`);
  }
  return document.toJS({ maxAliasCount: 0 });
}

interface Bilingual<T> {
  readonly en: T;
  readonly es: T;
}

function assertBilingual<T>(value: unknown, label: string): Bilingual<T> {
  if (
    typeof value !== "object" ||
    value === null ||
    !("en" in value) ||
    !("es" in value)
  ) {
    throw new Error(`${label} is missing its required en/es split`);
  }
  return value as Bilingual<T>;
}

async function loadBilingualYaml<T>(
  relativePath: string,
  label: string,
): Promise<Bilingual<T>> {
  const source = await readRepositoryFile(relativePath);
  return assertBilingual<T>(parseYaml(source, label), label);
}

export interface HeroContent {
  readonly kicker: string;
  readonly tagline: string;
  readonly subtitle: string;
  readonly collectionLabel: string;
}

export async function loadHero(lang: Lang): Promise<HeroContent> {
  const doc = await loadBilingualYaml<HeroContent>(
    "content/site/hero.yaml",
    "hero.yaml",
  );
  return doc[lang];
}

export interface MapDomainContent {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly connection: string;
}

export interface MapContent {
  readonly heading: string;
  readonly intro: string;
  readonly domains: readonly MapDomainContent[];
}

export async function loadMapContent(lang: Lang): Promise<MapContent> {
  const doc = await loadBilingualYaml<MapContent>(
    "content/site/map.yaml",
    "map.yaml",
  );
  return doc[lang];
}

export interface AboutContent {
  readonly heading: string;
  readonly bio: string;
  readonly principles: readonly string[];
}

export async function loadAbout(lang: Lang): Promise<AboutContent> {
  const doc = await loadBilingualYaml<AboutContent>(
    "content/site/about.yaml",
    "about.yaml",
  );
  return doc[lang];
}

export interface ContactContent {
  readonly heading: string;
  readonly intro: string;
}

export async function loadContact(lang: Lang): Promise<ContactContent> {
  const doc = await loadBilingualYaml<ContactContent>(
    "content/site/contact.yaml",
    "contact.yaml",
  );
  return doc[lang];
}

export interface EducationContent {
  readonly heading: string;
  readonly intro: string;
}

export async function loadEducationSection(
  lang: Lang,
): Promise<EducationContent> {
  const doc = await loadBilingualYaml<EducationContent>(
    "content/site/education.yaml",
    "education.yaml",
  );
  return doc[lang];
}

export interface ArchiveProjectContent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
}

export interface ArchiveContent {
  readonly heading: string;
  readonly intro: string;
  readonly projects: readonly ArchiveProjectContent[];
}

export async function loadArchive(lang: Lang): Promise<ArchiveContent> {
  const doc = await loadBilingualYaml<ArchiveContent>(
    "content/site/archive.yaml",
    "archive.yaml",
  );
  return doc[lang];
}

export interface CredentialVerified {
  readonly name: string;
  readonly issuer: string;
  readonly level: string;
  readonly issued: string;
  readonly expires: string;
  readonly url: string;
}

export interface CredentialTerse {
  readonly label: string;
  readonly sourcePath: string;
}

export interface CredentialsContent {
  readonly schemaVersion: string;
  readonly verified: readonly CredentialVerified[];
  readonly terse: readonly CredentialTerse[];
}

export async function loadCredentials(): Promise<CredentialsContent> {
  const source = await readRepositoryFile("content/site/credentials.yaml");
  const value = parseYaml(source, "credentials.yaml");
  if (
    typeof value !== "object" ||
    value === null ||
    !("verified" in value) ||
    !("terse" in value)
  ) {
    throw new Error("credentials.yaml is missing verified/terse records");
  }
  return value as CredentialsContent;
}

export interface DecisionNarrative {
  readonly decision: string;
  readonly summary: string;
}

export type DecisionNarrativeById = Readonly<
  Record<string, Bilingual<DecisionNarrative>>
>;

export async function loadDecisionNarratives(): Promise<DecisionNarrativeById> {
  const source = await readRepositoryFile("content/site/decisions.yaml");
  return parseYaml(source, "decisions.yaml") as DecisionNarrativeById;
}

export async function loadDecisionNarrative(
  id: string,
  lang: Lang,
): Promise<DecisionNarrative> {
  const all = await loadDecisionNarratives();
  const entry = all[id];
  if (entry === undefined) {
    throw new Error(`No bilingual narrative found for decision "${id}"`);
  }
  return entry[lang];
}
