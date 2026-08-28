export type DecisionStatus = "planned" | "building" | "verified" | "released";

/**
 * `detail` is required-but-nullable rather than optional, matching the
 * `links.*` convention below (never omit the key; `null` means "no detail
 * yet") — the closed-schema-friendly shape for ajv's `JSONSchemaType`, which
 * cannot express a plain optional property without pairing it with
 * `nullable`.
 */
export interface DecisionCapability {
  readonly label: string;
  readonly detail: string | null;
}

export interface DecisionEvidence {
  readonly type: string;
  readonly description: string;
  readonly reference: string;
}

export interface DecisionLinks {
  readonly repository: string | null;
  readonly demo: string | null;
  readonly methodology: string | null;
}

/**
 * The source-of-truth shape for one `portfolio.project.json` manifest under
 * `content/decisions/<id>/`. `status` is the only field the UI may render as
 * a project-state badge (AGENTS.md: never freehand copy). `buildStarted` is
 * null until the public build journey actually starts for that item.
 */
export interface DecisionManifest {
  readonly schemaVersion: "1.0.0";
  readonly collection: "five-decisions";
  readonly id: string;
  readonly title: string;
  readonly decision: string;
  readonly learningOrigin: string;
  readonly buildStarted: string | null;
  readonly status: DecisionStatus;
  readonly summary: string;
  readonly capabilities: readonly DecisionCapability[];
  readonly evidence: readonly DecisionEvidence[];
  readonly links: DecisionLinks;
}

/** One entry in the built, versioned registry lock file. */
export interface DecisionRegistryEntry {
  readonly id: string;
  readonly path: string;
  readonly schemaVersion: "1.0.0";
  readonly byteLength: number;
  readonly sha256: string;
}

/** The `apps/site/public/decisions/v1/manifest.json` lock file shape. */
export interface DecisionRegistryManifest {
  readonly schemaVersion: "1.0.0";
  readonly collection: "five-decisions";
  readonly entries: readonly DecisionRegistryEntry[];
}
