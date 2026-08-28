import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";

export interface PdfRasterizer {
  readonly name: string;
  /** Resolves `true` and writes `${outputBasePath}.png` on success. Never throws for an ordinary "unavailable" case — returns `false` instead. */
  attempt(pdfPath: string, outputBasePath: string): Promise<boolean>;
}

async function fileExists(candidatePath: string): Promise<boolean> {
  try {
    await access(candidatePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort only: shells out to the `pdftoppm` binary (poppler-utils) if
 * one is on `PATH`. cv-sync is a manual, occasional operation, so a missing
 * rasterizer is an expected, non-fatal environment difference, not an error
 * — this returns `false` rather than throwing when the binary is absent or
 * the conversion fails for any reason.
 */
export const pdftoppmRasterizer: PdfRasterizer = {
  name: "pdftoppm",
  async attempt(pdfPath, outputBasePath) {
    let result;
    try {
      result = spawnSync(
        "pdftoppm",
        [
          "-f",
          "1",
          "-l",
          "1",
          "-r",
          "150",
          "-png",
          "-singlefile",
          pdfPath,
          outputBasePath,
        ],
        { encoding: "utf8" },
      );
    } catch {
      return false;
    }
    if (result.error !== undefined || result.status !== 0) {
      return false;
    }
    return fileExists(`${outputBasePath}.png`);
  },
};

/** True when a `pdftoppm` binary actually answers on `PATH` right now. */
export function isPdftoppmAvailable(): boolean {
  try {
    const result = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
    return result.error === undefined && result.status === 0;
  } catch {
    return false;
  }
}
