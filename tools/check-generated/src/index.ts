import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { loadResume } from "@portfolio/resume";

await import("../../build-decisions/src/check-generated.ts");
await import("../../build-corpus/src/check-generated.ts");

const generatedProvenancePath = fileURLToPath(
  new URL(
    "../../../packages/resume/generated/resume-provenance.json",
    import.meta.url,
  ),
);
const { provenance } = await loadResume();
const expectedBytes = `${JSON.stringify(provenance, null, 2)}\n`;
const actualBytes = await readFile(generatedProvenancePath, "utf8");

if (actualBytes !== expectedBytes) {
  throw new Error(
    "Generated résumé provenance drifted; run packages/resume/tools/generate-provenance.ts through the integration owner",
  );
}

console.log("Generated résumé provenance is current");
