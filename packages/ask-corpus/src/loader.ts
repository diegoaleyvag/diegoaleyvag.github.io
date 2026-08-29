import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { corpusEntrySchema, corpusRegistryManifestSchema } from "./schema.ts";
import type { CorpusEntry, CorpusRegistryManifest } from "./types.ts";

export const CONTENT_CORPUS_DIRECTORY = "content/corpus" as const;

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});
addFormats(ajv);

const validateEntry = ajv.compile(corpusEntrySchema);
const validateRegistryManifest = ajv.compile(corpusRegistryManifestSchema);

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

export function parseCorpusEntryJson(
  source: string,
  label = "Ask Diego corpus entry",
): CorpusEntry {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
  if (!validateEntry(value)) {
    throw new Error(validationMessage(label, validateEntry.errors));
  }
  return deepFreeze(value as CorpusEntry);
}

export function parseCorpusRegistryManifestJson(
  source: string,
  label = "Ask Diego corpus registry manifest",
): CorpusRegistryManifest {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
  if (!validateRegistryManifest(value)) {
    throw new Error(validationMessage(label, validateRegistryManifest.errors));
  }
  return deepFreeze(value as CorpusRegistryManifest);
}

/**
 * Validates an in-memory candidate (not yet serialized) before the builder
 * writes it, the same role `assertDecisionRegistryManifest` plays for
 * `@portfolio/decisions`.
 */
export function assertCorpusRegistryManifest(
  value: unknown,
): asserts value is CorpusRegistryManifest {
  if (!validateRegistryManifest(value)) {
    throw new Error(
      validationMessage(
        "Ask Diego corpus registry manifest",
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

async function listJsonFilesRecursively(
  rootDirectory: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(path.join(rootDirectory, relativeDirectory), {
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of [...entries].sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const relativeChild = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listJsonFilesRecursively(rootDirectory, relativeChild)),
      );
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(relativeChild);
    }
  }
  return files;
}

export interface LoadedCorpusEntry {
  readonly id: string;
  readonly sourcePath: string;
  readonly entry: CorpusEntry;
}

/**
 * Reads every `content/corpus/**\/<id>.json` entry, validates it against the
 * closed schema, and returns entries sorted by id for deterministic
 * downstream output. Throws on the first invalid entry, duplicate id, or a
 * filename that doesn't match the entry's own `id` field, rather than
 * skipping it. Filesystem access happens here only — the build-time
 * `tools/build-corpus` tool and prerendered Astro pages, never the deployed
 * `/api/ask` function (see `./bundle.ts`).
 */
export async function loadCorpusEntries(): Promise<
  readonly LoadedCorpusEntry[]
> {
  const rootDirectory = await resolveRepositoryDirectory(
    CONTENT_CORPUS_DIRECTORY,
  );
  const relativeFiles = await listJsonFilesRecursively(rootDirectory);

  if (relativeFiles.length === 0) {
    throw new Error(
      `No Ask Diego corpus entries found under ${CONTENT_CORPUS_DIRECTORY}`,
    );
  }

  const loaded = await Promise.all(
    relativeFiles.map(async (relativeFile): Promise<LoadedCorpusEntry> => {
      const sourcePath = path.join(rootDirectory, relativeFile);
      const source = await readFile(sourcePath, "utf8");
      const entry = parseCorpusEntryJson(
        source,
        `${CONTENT_CORPUS_DIRECTORY}/${relativeFile.split(path.sep).join("/")}`,
      );
      const expectedFileName = `${entry.id}.json`;
      const actualFileName = path.basename(relativeFile);
      if (actualFileName !== expectedFileName) {
        throw new Error(
          `Ask Diego corpus entry id "${entry.id}" must match its filename "${actualFileName}"`,
        );
      }
      return { id: entry.id, sourcePath, entry };
    }),
  );

  const seenIds = new Set<string>();
  for (const { id } of loaded) {
    if (seenIds.has(id)) {
      throw new Error(`Duplicate Ask Diego corpus entry id: ${id}`);
    }
    seenIds.add(id);
  }

  return deepFreeze(
    [...loaded].sort((left, right) => left.id.localeCompare(right.id)),
  );
}
