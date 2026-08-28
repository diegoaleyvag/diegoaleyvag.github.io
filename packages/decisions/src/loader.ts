import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  decisionRegistryManifestSchema,
  portfolioProjectSchema,
} from "./schema.ts";
import type { DecisionManifest, DecisionRegistryManifest } from "./types.ts";

export const CONTENT_DECISIONS_DIRECTORY = "content/decisions" as const;
export const DECISIONS_MANIFEST_FILENAME = "portfolio.project.json" as const;

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});
addFormats(ajv);

const validateManifest = ajv.compile(portfolioProjectSchema);
const validateRegistryManifest = ajv.compile(decisionRegistryManifestSchema);

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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export function parseDecisionManifestJson(
  source: string,
  label = "Decision manifest",
): DecisionManifest {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
  if (!validateManifest(value)) {
    throw new Error(validationMessage(label, validateManifest.errors));
  }
  return deepFreeze(value as DecisionManifest);
}

export function parseDecisionRegistryManifestJson(
  source: string,
  label = "Decision registry manifest",
): DecisionRegistryManifest {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
  if (!validateRegistryManifest(value)) {
    throw new Error(validationMessage(label, validateRegistryManifest.errors));
  }
  return deepFreeze(value as DecisionRegistryManifest);
}

/**
 * Validates an in-memory candidate (not yet serialized) before the builder
 * writes it, the same role `assertRunBundle` played for the retired replay
 * builder.
 */
export function assertDecisionRegistryManifest(
  value: unknown,
): asserts value is DecisionRegistryManifest {
  if (!validateRegistryManifest(value)) {
    throw new Error(
      validationMessage(
        "Decision registry manifest",
        validateRegistryManifest.errors,
      ),
    );
  }
}

async function resolveRepositoryDirectory(
  relativePath: string,
): Promise<string> {
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
          `Unable to locate repository directory ${relativePath} from the current working directory`,
        );
      }
      directory = parent;
    }
  }
}

export interface LoadedDecisionManifest {
  readonly id: string;
  readonly directory: string;
  readonly sourcePath: string;
  readonly manifest: DecisionManifest;
}

/**
 * Reads every `content/decisions/<id>/portfolio.project.json`, validates it
 * against the closed schema, and returns entries sorted by id for
 * deterministic downstream output. Throws on the first invalid manifest,
 * duplicate id, or directory/id mismatch rather than skipping it.
 */
export async function loadDecisionManifests(): Promise<
  readonly LoadedDecisionManifest[]
> {
  const rootDirectory = await resolveRepositoryDirectory(
    CONTENT_DECISIONS_DIRECTORY,
  );
  const entries = await readdir(rootDirectory, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (directories.length === 0) {
    throw new Error(
      `No Five Decisions manifests found under ${CONTENT_DECISIONS_DIRECTORY}`,
    );
  }

  const loaded = await Promise.all(
    directories.map(async (directoryName): Promise<LoadedDecisionManifest> => {
      const sourcePath = path.join(
        rootDirectory,
        directoryName,
        DECISIONS_MANIFEST_FILENAME,
      );
      const source = await readFile(sourcePath, "utf8");
      const manifest = parseDecisionManifestJson(
        source,
        `${CONTENT_DECISIONS_DIRECTORY}/${directoryName}/${DECISIONS_MANIFEST_FILENAME}`,
      );
      if (manifest.id !== directoryName) {
        throw new Error(
          `Decision manifest id "${manifest.id}" must match its directory name "${directoryName}"`,
        );
      }
      return {
        id: manifest.id,
        directory: directoryName,
        sourcePath,
        manifest,
      };
    }),
  );

  const seenIds = new Set<string>();
  for (const { id } of loaded) {
    if (seenIds.has(id)) {
      throw new Error(`Duplicate Five Decisions manifest id: ${id}`);
    }
    seenIds.add(id);
  }

  return deepFreeze(
    [...loaded].sort((left, right) => left.id.localeCompare(right.id)),
  );
}
