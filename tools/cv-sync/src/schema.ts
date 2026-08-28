import Ajv2020, {
  type ErrorObject,
  type JSONSchemaType,
} from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

/**
 * The separate CV repository is maintained independently of this
 * portfolio's own `content/source/cv.yaml` and is not guaranteed to share
 * every optional field `@portfolio/resume`'s strict schema requires (e.g.
 * an internship `programme` label). Reusing that portfolio-specific schema
 * here would make a normal, legitimate shape difference in the *external*
 * file fail sync entirely. This schema validates the same overall document
 * shape but only requires what `tools/cv-sync` actually needs to produce a
 * PDF-accurate summary — `programme` is optional, not dropped.
 */

const nonEmptyString = { type: "string", minLength: 1 } as const;

export interface ExternalCvLink {
  readonly label: string;
  readonly url: string;
}

export interface ExternalCvExperience {
  readonly organisation: string;
  readonly role: string;
  readonly programme?: string;
  readonly dates: string;
  readonly location: string;
  readonly bullets: readonly string[];
}

export interface ExternalCvProject {
  readonly name: string;
  readonly descriptor: string;
  readonly dates: string;
  readonly bullets: readonly string[];
}

export interface ExternalCvEducation {
  readonly institution: string;
  readonly credential: string;
  readonly dates: string;
  readonly location: string;
  readonly detail: string;
}

export interface ExternalCvSkill {
  readonly label: string;
  readonly value: string;
}

export interface ExternalCvDocument {
  readonly name: string;
  readonly headline: string;
  readonly location: string;
  readonly availability: string;
  readonly email: string;
  readonly linkedin: ExternalCvLink;
  readonly github: ExternalCvLink;
  readonly summary: string;
  readonly experience: readonly ExternalCvExperience[];
  readonly projects: readonly ExternalCvProject[];
  readonly education: readonly ExternalCvEducation[];
  readonly skills: readonly ExternalCvSkill[];
  readonly certifications: readonly string[];
}

const linkSchema: JSONSchemaType<ExternalCvLink> = {
  type: "object",
  additionalProperties: false,
  required: ["label", "url"],
  properties: {
    label: nonEmptyString,
    url: { type: "string", minLength: 1, format: "uri" },
  },
};

const experienceSchema: JSONSchemaType<ExternalCvExperience> = {
  type: "object",
  additionalProperties: false,
  required: ["organisation", "role", "dates", "location", "bullets"],
  properties: {
    organisation: nonEmptyString,
    role: nonEmptyString,
    programme: { ...nonEmptyString, nullable: true },
    dates: nonEmptyString,
    location: nonEmptyString,
    bullets: { type: "array", minItems: 1, items: nonEmptyString },
  },
};

const projectSchema: JSONSchemaType<ExternalCvProject> = {
  type: "object",
  additionalProperties: false,
  required: ["name", "descriptor", "dates", "bullets"],
  properties: {
    name: nonEmptyString,
    descriptor: nonEmptyString,
    dates: nonEmptyString,
    bullets: { type: "array", minItems: 1, items: nonEmptyString },
  },
};

const educationSchema: JSONSchemaType<ExternalCvEducation> = {
  type: "object",
  additionalProperties: false,
  required: ["institution", "credential", "dates", "location", "detail"],
  properties: {
    institution: nonEmptyString,
    credential: nonEmptyString,
    dates: nonEmptyString,
    location: nonEmptyString,
    detail: nonEmptyString,
  },
};

const skillSchema: JSONSchemaType<ExternalCvSkill> = {
  type: "object",
  additionalProperties: false,
  required: ["label", "value"],
  properties: {
    label: nonEmptyString,
    value: nonEmptyString,
  },
};

const externalCvSchema: JSONSchemaType<ExternalCvDocument> = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/cv-sync/external-cv/v1",
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "headline",
    "location",
    "availability",
    "email",
    "linkedin",
    "github",
    "summary",
    "experience",
    "projects",
    "education",
    "skills",
    "certifications",
  ],
  properties: {
    name: nonEmptyString,
    headline: nonEmptyString,
    location: nonEmptyString,
    availability: nonEmptyString,
    email: { type: "string", minLength: 1, format: "email" },
    linkedin: linkSchema,
    github: linkSchema,
    summary: nonEmptyString,
    experience: { type: "array", minItems: 1, items: experienceSchema },
    projects: { type: "array", minItems: 1, items: projectSchema },
    education: { type: "array", minItems: 1, items: educationSchema },
    skills: { type: "array", minItems: 1, items: skillSchema },
    certifications: { type: "array", minItems: 1, items: nonEmptyString },
  },
};

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});
addFormats(ajv);
const validateExternalCv = ajv.compile(externalCvSchema);

function validationMessage(
  errors: readonly ErrorObject[] | null | undefined,
): string {
  const issues = (errors ?? [])
    .map(
      ({ instancePath, message }) =>
        `${instancePath || "/"}: ${message ?? "invalid value"}`,
    )
    .join("\n");
  return `Source CV failed validation${issues === "" ? "" : `:\n${issues}`}`;
}

/**
 * Parses and validates the *external* CV repository's `cv.yaml`. Deliberately
 * more permissive than `@portfolio/resume`'s `parseCvYaml` — see the module
 * comment above — but still a closed, strict schema: an actually malformed
 * source document still fails loudly rather than producing a silently wrong
 * summary.
 */
export function parseExternalCvYaml(source: string): ExternalCvDocument {
  const document = parseDocument(source, {
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
  });
  if (document.errors.length > 0) {
    throw new Error("Source CV YAML parsing failed");
  }
  const value = document.toJS({ maxAliasCount: 0 });
  if (!validateExternalCv(value)) {
    throw new Error(validationMessage(validateExternalCv.errors));
  }
  return value as ExternalCvDocument;
}
