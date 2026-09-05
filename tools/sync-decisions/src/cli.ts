import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import prettier from "prettier";
import { parse, stringify } from "yaml";

import {
  parseDecisionManifestJson,
  type DecisionManifest,
} from "@portfolio/decisions";

const execFile = promisify(execFileCallback);

const sources = {
  prism: {
    commit: "0d7a6d07aa32199df148971eb565b40ecf798b5f",
    repository: "https://github.com/diegoaleyvag/prism",
    status: "released",
    demo: "https://five-decisions-prism.vercel.app",
  },
  relay: {
    commit: "40d3063824a00f5d29b740c78de981b210871fe6",
    repository: "https://github.com/diegoaleyvag/relay",
    status: "released",
    demo: "https://five-decisions-relay.vercel.app",
  },
  limen: {
    commit: "31a6e8b34b4e9ba69a669773589ca00929a22002",
    repository: "https://github.com/diegoaleyvag/limen",
    status: "released",
    demo: "https://five-decisions-limen.vercel.app",
  },
  vector: {
    commit: "cbc2b1d79441d044c2b96341c5dcb00109005f29",
    repository: "https://github.com/diegoaleyvag/vector",
    status: "released",
    demo: "https://five-decisions-vector.vercel.app",
  },
  axiom: {
    commit: "adcfd97de3d233faefec8336273d548948ef18b4",
    repository: "https://github.com/diegoaleyvag/axiom",
    status: "verified",
    demo: null,
  },
} as const;

type DecisionId = keyof typeof sources;

const spanishNarratives: Record<
  DecisionId,
  { readonly decision: string; readonly summary: string }
> = {
  prism: {
    decision: "¿Cuándo es un modelo suficientemente bueno?",
    summary:
      "Un banco de trabajo determinista y simulado para evaluar compensaciones específicas de cada tarea con métricas inspectables y un explorador estático de evidencia.",
  },
  relay: {
    decision: "¿Qué debería sobrevivir a un fallo?",
    summary:
      "Un laboratorio de fiabilidad para flujos de trabajo de agentes observables y con puntos de control.",
  },
  limen: {
    decision: "¿Qué pertenece al contexto?",
    summary:
      "Un laboratorio determinista para comparar estrategias de selección de contexto con presupuestos fijos.",
  },
  vector: {
    decision: "¿Qué arquitectura se ajusta a las restricciones?",
    summary:
      "Un estudio transparente para comparar patrones de arquitectura de IA bajo restricciones explícitas.",
  },
  axiom: {
    decision: "¿Puede una salida de IA mantener su contrato?",
    summary:
      "Un comprobador de contratos preparado para CI para salidas de IA estructuradas, con evaluación sin conexión e informes sin valores.",
  },
};

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

function isImmutableHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".vercel.app") &&
      url.hostname.includes("-") &&
      !/^five-decisions-(prism|relay|limen|vector)\.vercel\.app$/.test(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}

function assertProductionEvidence(
  id: DecisionId,
  manifest: DecisionManifest,
): void {
  const productionEvidence = manifest.evidence.filter(
    (entry) => entry.type === "production deployment",
  );

  if (id === "axiom") {
    if (productionEvidence.length !== 0) {
      throw new Error("Axiom must not claim a production deployment");
    }
    return;
  }

  if (productionEvidence.length !== 1) {
    throw new Error(
      `${id} must have exactly one production deployment evidence`,
    );
  }

  const [entry] = productionEvidence;
  if (
    entry === undefined ||
    !isImmutableHttpsUrl(entry.reference) ||
    /dpl_|[0-9a-f]{7,}/i.test(entry.description)
  ) {
    throw new Error(
      `${id} production evidence must use an immutable HTTPS URL and human-only description`,
    );
  }
}

function repositoryRoot(): string {
  return path.resolve(import.meta.dirname, "../../..");
}

async function git(directory: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFile("git", ["-C", directory, ...args]);
  return stdout.trim();
}

function assertSourceManifest(
  id: DecisionId,
  manifest: DecisionManifest,
): void {
  const expected = sources[id];
  if (
    manifest.id !== id ||
    manifest.status !== expected.status ||
    manifest.links.repository !== expected.repository ||
    manifest.links.demo !== expected.demo
  ) {
    throw new Error(
      `Source manifest does not match the approved C8 record: ${id}`,
    );
  }
  assertProductionEvidence(id, manifest);
}

async function loadSource(
  workspace: string,
  id: DecisionId,
): Promise<{
  manifest: DecisionManifest;
  sourceSha256: string;
  commit: string;
}> {
  const directory = path.join(workspace, id);
  const expected = sources[id];
  if ((await git(directory, "status", "--porcelain")) !== "") {
    throw new Error(`Source checkout is dirty: ${id}`);
  }
  const commit = await git(directory, "rev-parse", "HEAD");
  if (commit !== expected.commit) {
    throw new Error(`Source commit mismatch for ${id}: ${commit}`);
  }

  const source = await readFile(
    path.join(directory, "portfolio.project.json"),
    "utf8",
  );
  const manifest = parseDecisionManifestJson(
    source,
    `${id}/portfolio.project.json`,
  );
  assertSourceManifest(id, manifest);
  return { manifest, sourceSha256: sha256(source), commit };
}

function spanishStatus(status: DecisionManifest["status"]): string {
  return {
    planned: "planeado",
    building: "en construcción",
    verified: "verificado",
    released: "publicado",
  }[status];
}

export const WORKSPACE_USAGE =
  "Usage: pnpm decisions:sync --workspace <repositories-directory>";

/**
 * Extracts the `--workspace <repositories-directory>` argument from an
 * argv-shaped array. This is the tool's one, explicit, required input for
 * locating the sibling product checkouts (Prism, Relay, Limen, Vector,
 * Axiom) — there is no default and no environment-variable fallback, so
 * this never silently assumes a specific machine's local absolute path
 * (e.g. a developer's home directory layout). A caller on any machine
 * must pass its own real path.
 */
export function parseWorkspaceArg(argv: readonly string[]): string {
  const workspaceIndex = argv.indexOf("--workspace");
  const workspace =
    workspaceIndex === -1 ? undefined : argv[workspaceIndex + 1];
  if (workspace === undefined) {
    throw new Error(WORKSPACE_USAGE);
  }
  return workspace;
}

async function main(): Promise<void> {
  const workspace = parseWorkspaceArg(process.argv);

  const root = repositoryRoot();
  const synced = await Promise.all(
    (Object.keys(sources) as DecisionId[]).map(
      async (id) => [id, await loadSource(workspace, id)] as const,
    ),
  );
  const sourceById = Object.fromEntries(synced) as Record<
    DecisionId,
    Awaited<ReturnType<typeof loadSource>>
  >;

  for (const id of Object.keys(sources) as DecisionId[]) {
    const destination = path.join(
      root,
      "content/decisions",
      id,
      "portfolio.project.json",
    );
    await writeFile(
      destination,
      `${JSON.stringify(sourceById[id].manifest, null, 2)}\n`,
      "utf8",
    );
  }

  const narratives = parse(
    await readFile(path.join(root, "content/site/decisions.yaml"), "utf8"),
  ) as Record<
    string,
    {
      en: { decision: string; summary: string };
      es: { decision: string; summary: string };
    }
  >;
  for (const id of Object.keys(sources) as DecisionId[]) {
    const manifest = sourceById[id].manifest;
    narratives[id].en = {
      decision: manifest.decision,
      summary: manifest.summary,
    };
    narratives[id].es = spanishNarratives[id];
  }
  await writeFile(
    path.join(root, "content/site/decisions.yaml"),
    await prettier.format(
      [
        "# Bilingual narrative wrapper for validated Five Decisions manifests.",
        "# English mirrors the canonical manifest; Spanish is a faithful translation.",
        "",
        stringify(narratives),
      ].join("\n"),
      { parser: "yaml" },
    ),
    "utf8",
  );

  for (const id of Object.keys(sources) as DecisionId[]) {
    const corpusPath = path.join(
      root,
      "content/corpus/decisions",
      `decision-${id}.json`,
    );
    const corpus = JSON.parse(await readFile(corpusPath, "utf8")) as {
      en: { answer: string; keywords: string[] };
      es: { answer: string; keywords: string[] };
    };
    const manifest = sourceById[id].manifest;
    corpus.en.answer = `${manifest.summary} Status: ${manifest.status}.`;
    corpus.es.answer = `${manifest.title}: ${narratives[id].es.summary} Estado: ${spanishStatus(manifest.status)}.`;
    corpus.en.keywords = [
      manifest.id,
      manifest.id,
      ...corpus.en.keywords.filter((keyword) => keyword !== manifest.id),
    ];
    corpus.es.keywords = [
      manifest.id,
      manifest.id,
      ...corpus.es.keywords.filter((keyword) => keyword !== manifest.id),
    ];
    await writeFile(corpusPath, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
  }

  for (const id of Object.keys(sources) as DecisionId[]) {
    const { commit, sourceSha256 } = sourceById[id];
    console.log(`${id}\t${commit}\t${sourceSha256}`);
  }
}

// Only run when executed directly (`tsx tools/sync-decisions/src/cli.ts` /
// `pnpm decisions:sync`), never on import — this keeps `parseWorkspaceArg`
// and the other exports above safely importable from tests without
// triggering a real, filesystem-writing sync.
const isDirectlyExecuted =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectlyExecuted) {
  await main();
}
