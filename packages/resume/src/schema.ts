import type { JSONSchemaType } from "ajv";

import type {
  CvDocument,
  CvEducation,
  CvExperience,
  CvLink,
  CvProject,
  CvSkill,
  PublicationConsent,
} from "./types.ts";

const nonEmptyString = { type: "string", minLength: 1 } as const;

const linkSchema: JSONSchemaType<CvLink> = {
  type: "object",
  additionalProperties: false,
  required: ["label", "url"],
  properties: {
    label: nonEmptyString,
    url: { type: "string", minLength: 1, format: "uri" },
  },
};

const experienceSchema: JSONSchemaType<CvExperience> = {
  type: "object",
  additionalProperties: false,
  required: [
    "organisation",
    "role",
    "programme",
    "dates",
    "location",
    "bullets",
  ],
  properties: {
    organisation: nonEmptyString,
    role: nonEmptyString,
    programme: nonEmptyString,
    dates: nonEmptyString,
    location: nonEmptyString,
    bullets: {
      type: "array",
      minItems: 1,
      items: nonEmptyString,
    },
  },
};

const projectSchema: JSONSchemaType<CvProject> = {
  type: "object",
  additionalProperties: false,
  required: ["name", "descriptor", "dates", "bullets"],
  properties: {
    name: nonEmptyString,
    descriptor: nonEmptyString,
    dates: nonEmptyString,
    bullets: {
      type: "array",
      minItems: 1,
      items: nonEmptyString,
    },
  },
};

const educationSchema: JSONSchemaType<CvEducation> = {
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

const skillSchema: JSONSchemaType<CvSkill> = {
  type: "object",
  additionalProperties: false,
  required: ["label", "value"],
  properties: {
    label: nonEmptyString,
    value: nonEmptyString,
  },
};

export const cvSchema: JSONSchemaType<CvDocument> = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/portfolio/cv/v1",
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
    experience: {
      type: "array",
      minItems: 1,
      items: experienceSchema,
    },
    projects: {
      type: "array",
      minItems: 1,
      items: projectSchema,
    },
    education: {
      type: "array",
      minItems: 1,
      items: educationSchema,
    },
    skills: {
      type: "array",
      minItems: 1,
      items: skillSchema,
    },
    certifications: {
      type: "array",
      minItems: 1,
      items: nonEmptyString,
    },
  },
};

export const publicationConsentSchema: JSONSchemaType<PublicationConsent> = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/portfolio/publication-consent/v1",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "contact_fields"],
  properties: {
    schema_version: { type: "string", const: "1.0.0" },
    contact_fields: {
      type: "string",
      enum: ["pending", "approved"],
    },
  },
};
