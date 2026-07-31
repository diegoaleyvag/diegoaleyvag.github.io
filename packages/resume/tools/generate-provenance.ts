import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { loadResume } from "../src/loader.ts";

const outputUrl = new URL(
  "../generated/resume-provenance.json",
  import.meta.url,
);
const outputPath = fileURLToPath(outputUrl);
const temporaryPath = `${outputPath}.tmp`;

const { provenance } = await loadResume();
const bytes = `${JSON.stringify(provenance, null, 2)}\n`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(temporaryPath, bytes, "utf8");
await rm(outputPath, { force: true });
await rename(temporaryPath, outputPath);

console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
