import { createHash } from "node:crypto";

import {
  assertDecisionRegistryManifest,
  DECISIONS_COLLECTION,
  DECISION_SCHEMA_VERSION,
  loadDecisionManifests,
  type DecisionManifest,
  type DecisionRegistryEntry,
  type DecisionRegistryManifest,
  type LoadedDecisionManifest,
} from "@portfolio/decisions";

export const DECISIONS_OUTPUT_PATH_PREFIX = "/decisions/v1/" as const;

export interface GeneratedDecisionArtifacts {
  readonly files: ReadonlyMap<string, Uint8Array>;
  readonly manifest: DecisionRegistryManifest;
  readonly loaded: readonly LoadedDecisionManifest[];
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function encodeArtifact(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Rebuilds every field in a fixed order so the output is byte-identical
 * regardless of how a source manifest happened to order its own keys.
 */
function canonicalizeManifest(manifest: DecisionManifest): DecisionManifest {
  return {
    schemaVersion: manifest.schemaVersion,
    collection: manifest.collection,
    id: manifest.id,
    title: manifest.title,
    decision: manifest.decision,
    learningOrigin: manifest.learningOrigin,
    buildStarted: manifest.buildStarted,
    status: manifest.status,
    summary: manifest.summary,
    capabilities: manifest.capabilities.map((capability) => ({
      label: capability.label,
      detail: capability.detail,
    })),
    evidence: manifest.evidence.map((entry) => ({
      type: entry.type,
      description: entry.description,
      reference: entry.reference,
    })),
    links: {
      repository: manifest.links.repository,
      demo: manifest.links.demo,
      methodology: manifest.links.methodology,
    },
  };
}

/**
 * Reads every source manifest, validates it, canonicalizes field order, and
 * builds the static JSON files plus the registry lock file in memory. Pure
 * and network-free: the same source manifests always produce byte-identical
 * output, which `check-generated.ts` relies on for its drift check.
 */
export async function buildDecisionsArtifacts(): Promise<GeneratedDecisionArtifacts> {
  const loaded = await loadDecisionManifests();

  const files = new Map<string, Uint8Array>();
  const entries: DecisionRegistryEntry[] = [];

  for (const { id, manifest } of loaded) {
    const bytes = encodeArtifact(canonicalizeManifest(manifest));
    files.set(`${id}.json`, bytes);
    entries.push({
      id,
      path: `${DECISIONS_OUTPUT_PATH_PREFIX}${id}.json`,
      schemaVersion: DECISION_SCHEMA_VERSION,
      byteLength: bytes.byteLength,
      sha256: sha256Hex(bytes),
    });
  }

  const manifestCandidate: DecisionRegistryManifest = {
    schemaVersion: DECISION_SCHEMA_VERSION,
    collection: DECISIONS_COLLECTION,
    entries,
  };
  assertDecisionRegistryManifest(manifestCandidate);
  files.set("manifest.json", encodeArtifact(manifestCandidate));

  return { files, manifest: manifestCandidate, loaded };
}
