import { access, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Walks up from the current working directory to find the repository root
 * (marked by `AGENTS.md`) and resolves `relativePath` against it. Mirrors
 * the same pattern `@portfolio/resume` and `@portfolio/decisions` use, so
 * every content loader in this app finds the same files regardless of
 * whether Astro's build runs from the repo root or `apps/site/`.
 */
export async function resolveRepositoryFile(
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
          `Unable to locate repository file ${relativePath} from the current working directory`,
        );
      }
      directory = parent;
    }
  }
}

export async function readRepositoryFile(
  relativePath: string,
): Promise<string> {
  const filePath = await resolveRepositoryFile(relativePath);
  return readFile(filePath, "utf8");
}

/**
 * Same walk as `resolveRepositoryFile`, but tolerates the target being
 * absent — callers that must degrade honestly (résumé transcription,
 * cv-sync assets) rather than hard-crash need this instead of a try/catch
 * around a thrown "not found".
 */
export async function tryResolveRepositoryFile(
  relativePath: string,
): Promise<string | null> {
  try {
    return await resolveRepositoryFile(relativePath);
  } catch {
    return null;
  }
}
