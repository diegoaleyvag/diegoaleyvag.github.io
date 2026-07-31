import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

import { cvSchema, publicationConsentSchema } from "./schema.ts";
import type {
  CvDocument,
  CvSourcePath,
  LoadedResume,
  PublicationConsent,
  ResumeEducationView,
  ResumeExperienceView,
  ResumeFact,
  ResumeProjectView,
  ResumeProvenanceManifest,
  ResumeSkillView,
  ResumeViewModel,
} from "./types.ts";

export const CANONICAL_CV_SOURCE_FILE = "content/source/cv.yaml" as const;
export const PUBLICATION_CONSENT_FILE =
  "content/publication-consent.yaml" as const;

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});
addFormats(ajv);

const validateCv = ajv.compile(cvSchema);
const validatePublicationConsent = ajv.compile(publicationConsentSchema);

async function resolveRepositoryFile(relativePath: string): Promise<string> {
  let directory = path.resolve(process.cwd());

  while (true) {
    const candidate = path.join(directory, relativePath);
    try {
      await Promise.all([
        access(path.join(directory, "AGENTS.md")),
        access(candidate),
      ]);
      return candidate;
    } catch {
      const parent = path.dirname(directory);
      if (parent === directory) {
        throw new Error(
          `Unable to locate repository file ${relativePath} from the current working directory`,
        );
      }
      directory = parent;
    }
  }
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function validationMessage(
  label: string,
  errors: readonly ErrorObject[] | null | undefined,
): string {
  const issues = (errors ?? [])
    .map(
      ({ instancePath, message }) =>
        `${instancePath || "/"}: ${message ?? "invalid value"}`,
    )
    .join("\n");
  return `${label} failed strict validation${issues === "" ? "" : `:\n${issues}`}`;
}

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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export function parseCvYaml(source: string): CvDocument {
  const value = parseYaml(source, "Canonical CV");
  if (!validateCv(value)) {
    throw new Error(validationMessage("Canonical CV", validateCv.errors));
  }
  return deepFreeze(value);
}

export function parsePublicationConsentYaml(
  source: string,
): PublicationConsent {
  const value = parseYaml(source, "Publication consent");
  if (!validatePublicationConsent(value)) {
    throw new Error(
      validationMessage(
        "Publication consent",
        validatePublicationConsent.errors,
      ),
    );
  }
  return deepFreeze(value);
}

function fact<Path extends CvSourcePath>(
  path: Path,
  value: string,
): ResumeFact<Path> {
  return deepFreeze({ path, value, sha256: sha256(value) });
}

export function createResumeViewModel(document: CvDocument): ResumeViewModel {
  const experience: ResumeExperienceView[] = document.experience.map(
    (entry, index) => ({
      organisation: fact(
        `experience[${index}].organisation`,
        entry.organisation,
      ),
      role: fact(`experience[${index}].role`, entry.role),
      programme: fact(`experience[${index}].programme`, entry.programme),
      dates: fact(`experience[${index}].dates`, entry.dates),
      location: fact(`experience[${index}].location`, entry.location),
      bullets: entry.bullets.map((value, bulletIndex) =>
        fact(`experience[${index}].bullets[${bulletIndex}]`, value),
      ),
    }),
  );

  const projects: ResumeProjectView[] = document.projects.map(
    (entry, index) => ({
      name: fact(`projects[${index}].name`, entry.name),
      descriptor: fact(`projects[${index}].descriptor`, entry.descriptor),
      dates: fact(`projects[${index}].dates`, entry.dates),
      bullets: entry.bullets.map((value, bulletIndex) =>
        fact(`projects[${index}].bullets[${bulletIndex}]`, value),
      ),
    }),
  );

  const education: ResumeEducationView[] = document.education.map(
    (entry, index) => ({
      institution: fact(`education[${index}].institution`, entry.institution),
      credential: fact(`education[${index}].credential`, entry.credential),
      dates: fact(`education[${index}].dates`, entry.dates),
      location: fact(`education[${index}].location`, entry.location),
      detail: fact(`education[${index}].detail`, entry.detail),
    }),
  );

  const skills: ResumeSkillView[] = document.skills.map((entry, index) => ({
    label: fact(`skills[${index}].label`, entry.label),
    value: fact(`skills[${index}].value`, entry.value),
  }));

  return deepFreeze({
    identity: {
      name: fact("name", document.name),
      headline: fact("headline", document.headline),
      location: fact("location", document.location),
      availability: fact("availability", document.availability),
      email: fact("email", document.email),
      linkedin: {
        label: fact("linkedin.label", document.linkedin.label),
        url: fact("linkedin.url", document.linkedin.url),
      },
      github: {
        label: fact("github.label", document.github.label),
        url: fact("github.url", document.github.url),
      },
      summary: fact("summary", document.summary),
    },
    experience,
    projects,
    education,
    skills,
    certifications: document.certifications.map((value, index) =>
      fact(`certifications[${index}]`, value),
    ),
  });
}

export function collectResumeFacts(
  view: ResumeViewModel,
): readonly ResumeFact[] {
  const facts: ResumeFact[] = [
    view.identity.name,
    view.identity.headline,
    view.identity.location,
    view.identity.availability,
    view.identity.email,
    view.identity.linkedin.label,
    view.identity.linkedin.url,
    view.identity.github.label,
    view.identity.github.url,
    view.identity.summary,
  ];

  for (const entry of view.experience) {
    facts.push(
      entry.organisation,
      entry.role,
      entry.programme,
      entry.dates,
      entry.location,
      ...entry.bullets,
    );
  }
  for (const entry of view.projects) {
    facts.push(entry.name, entry.descriptor, entry.dates, ...entry.bullets);
  }
  for (const entry of view.education) {
    facts.push(
      entry.institution,
      entry.credential,
      entry.dates,
      entry.location,
      entry.detail,
    );
  }
  for (const entry of view.skills) {
    facts.push(entry.label, entry.value);
  }
  facts.push(...view.certifications);

  return deepFreeze(facts);
}

export function createResumeProvenance(
  sourceFileSha256: string,
  facts: readonly ResumeFact[],
): ResumeProvenanceManifest {
  return deepFreeze({
    schema_version: "1.0.0",
    route: "/resume/",
    source_file: CANONICAL_CV_SOURCE_FILE,
    source_file_sha256: sourceFileSha256,
    entries: facts.map(({ path, sha256: valueSha256 }) => ({
      route: "/resume/",
      source_path: path,
      source_value_sha256: valueSha256,
      rendered_value_sha256: valueSha256,
    })),
  });
}

export async function loadResume(): Promise<LoadedResume> {
  const sourcePath = await resolveRepositoryFile(CANONICAL_CV_SOURCE_FILE);
  const sourceBytes = await readFile(sourcePath);
  const document = parseCvYaml(sourceBytes.toString("utf8"));
  const view = createResumeViewModel(document);
  const facts = collectResumeFacts(view);
  const sourceSha256 = sha256(sourceBytes);
  const provenance = createResumeProvenance(sourceSha256, facts);
  const factsByPath = new Map(facts.map((entry) => [entry.path, entry]));

  return deepFreeze({
    sourceFile: CANONICAL_CV_SOURCE_FILE,
    sourceSha256,
    document,
    facts,
    view,
    provenance,
    fact: (path: CvSourcePath): ResumeFact => {
      const entry = factsByPath.get(path);
      if (entry === undefined) {
        throw new Error(`Unknown canonical CV source path: ${path}`);
      }
      return entry;
    },
  });
}

export async function loadPublicationConsent(): Promise<PublicationConsent> {
  const consentPath = await resolveRepositoryFile(PUBLICATION_CONSENT_FILE);
  const source = await readFile(consentPath, "utf8");
  return parsePublicationConsentYaml(source);
}
