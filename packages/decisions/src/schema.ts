import type { JSONSchemaType } from "ajv";

import type {
  DecisionCapability,
  DecisionEvidence,
  DecisionLinks,
  DecisionManifest,
  DecisionRegistryEntry,
  DecisionRegistryManifest,
} from "./types.ts";

export const DECISION_SCHEMA_VERSION = "1.0.0" as const;
export const DECISIONS_COLLECTION = "five-decisions" as const;

const slugPattern = "^[a-z][a-z0-9-]*$";
const yearMonthPattern = "^\\d{4}-\\d{2}$";
const isoDatePattern = "^\\d{4}-\\d{2}-\\d{2}$";
const digestPattern = "^[a-f0-9]{64}$";
const decisionStatusEnum = [
  "planned",
  "building",
  "verified",
  "released",
] as const;

// ajv's `JSONSchemaType` cannot express a required-but-nullable string with
// the simpler `{ type: "string", nullable: true }` shorthand — that shape
// only satisfies an *optional* (TS `?:`) property. A required `string |
// null` property needs this explicit `oneOf` instead; see
// node_modules/ajv/dist/types/json-schema.d.ts's `Nullable<T>` helper.
const nullableStringSchema = (
  stringConstraints: Record<string, unknown>,
): {
  oneOf: [
    { type: "string" } & Record<string, unknown>,
    { type: "null"; nullable: true },
  ];
} => ({
  oneOf: [
    { type: "string", ...stringConstraints },
    { type: "null", nullable: true },
  ],
});

const capabilitySchema: JSONSchemaType<DecisionCapability> = {
  type: "object",
  additionalProperties: false,
  required: ["label", "detail"],
  properties: {
    label: { type: "string", minLength: 1, maxLength: 80 },
    detail: nullableStringSchema({ minLength: 1, maxLength: 240 }),
  },
};

const evidenceSchema: JSONSchemaType<DecisionEvidence> = {
  type: "object",
  additionalProperties: false,
  required: ["type", "description", "reference"],
  properties: {
    type: { type: "string", minLength: 1, maxLength: 60 },
    description: { type: "string", minLength: 1, maxLength: 320 },
    reference: { type: "string", minLength: 1, maxLength: 2048 },
  },
};

const linksSchema: JSONSchemaType<DecisionLinks> = {
  type: "object",
  additionalProperties: false,
  required: ["repository", "demo", "methodology"],
  properties: {
    repository: nullableStringSchema({ minLength: 1, format: "uri" }),
    demo: nullableStringSchema({ minLength: 1, format: "uri" }),
    methodology: nullableStringSchema({ minLength: 1, format: "uri" }),
  },
};

/**
 * Versioned, closed schema for one `content/decisions/<id>/portfolio.project.json`
 * source manifest. Mirrors the strict-AJV, `additionalProperties: false`
 * discipline in `@portfolio/resume`'s `cvSchema`: unknown or missing fields
 * fail validation, never a silent pass. `capabilities`/`evidence` may be
 * empty arrays — an unstarted or just-started decision has none yet, and
 * none may ever be invented (AGENTS.md, content.mdc).
 */
export const portfolioProjectSchema: JSONSchemaType<DecisionManifest> = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.example.invalid/portfolio/decision-manifest/v1",
  title: "Five Decisions project manifest v1",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "collection",
    "id",
    "title",
    "decision",
    "learningOrigin",
    "buildStarted",
    "status",
    "summary",
    "capabilities",
    "evidence",
    "links",
  ],
  properties: {
    schemaVersion: { type: "string", const: DECISION_SCHEMA_VERSION },
    collection: { type: "string", const: DECISIONS_COLLECTION },
    id: { type: "string", pattern: slugPattern, maxLength: 40 },
    title: { type: "string", minLength: 1, maxLength: 60 },
    decision: { type: "string", minLength: 1, maxLength: 200 },
    learningOrigin: { type: "string", pattern: yearMonthPattern },
    buildStarted: nullableStringSchema({ pattern: isoDatePattern }),
    status: { type: "string", enum: decisionStatusEnum },
    summary: { type: "string", minLength: 1, maxLength: 360 },
    capabilities: {
      type: "array",
      items: capabilitySchema,
    },
    evidence: {
      type: "array",
      items: evidenceSchema,
    },
    links: linksSchema,
  },
};

const registryEntrySchema: JSONSchemaType<DecisionRegistryEntry> = {
  type: "object",
  additionalProperties: false,
  required: ["id", "path", "schemaVersion", "byteLength", "sha256"],
  properties: {
    id: { type: "string", pattern: slugPattern, maxLength: 40 },
    path: { type: "string", pattern: "^/decisions/v1/[a-z0-9-]+\\.json$" },
    schemaVersion: { type: "string", const: DECISION_SCHEMA_VERSION },
    byteLength: { type: "integer", minimum: 1 },
    sha256: { type: "string", pattern: digestPattern },
  },
};

/**
 * Versioned, closed schema for the built `apps/site/public/decisions/v1/manifest.json`
 * lock file `tools/build-decisions` writes. Byte-identical on every rebuild
 * from the same source manifests (no wall clock, no non-deterministic order).
 */
export const decisionRegistryManifestSchema: JSONSchemaType<DecisionRegistryManifest> =
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://schemas.example.invalid/portfolio/decision-registry-manifest/v1",
    title: "Five Decisions registry manifest v1",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "collection", "entries"],
    properties: {
      schemaVersion: { type: "string", const: DECISION_SCHEMA_VERSION },
      collection: { type: "string", const: DECISIONS_COLLECTION },
      entries: {
        type: "array",
        minItems: 1,
        items: registryEntrySchema,
      },
    },
  };
