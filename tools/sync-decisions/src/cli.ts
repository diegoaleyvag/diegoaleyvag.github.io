import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import prettier from "prettier";
import { parse, stringify } from "yaml";

import {
  parseDecisionManifestJson,
  type DecisionManifest,
} from "@portfolio/decisions";

const execFile = promisify(execFileCallback);
const SOURCE_BRANCH = "feat/five-decisions-integration";

const sources = {
  prism: {
    commit: "859b2ddc31c91f12d0ada003023b4c9d1c5f1643",
    repository: "https://github.com/diegoaleyvag/prism",
    status: "building",
  },
  relay: {
    commit: "156070f1733a7e77855bd28642eedbe36e1852d3",
    repository: "https://github.com/diegoaleyvag/relay",
    status: "verified",
  },
  limen: {
    commit: "7a52df6357d0cc8cf9f1fa63f30d3f3354ae478c",
    repository: "https://github.com/diegoaleyvag/limen",
    status: "building",
  },
  vector: {
    commit: "139ad4c8d83a9b31ab27ca7a4afc8dcb1ef16f50",
    repository: "https://github.com/diegoaleyvag/vector",
    status: "building",
  },
  axiom: {
    commitPrefix: "477b866",
    repository: "https://github.com/diegoaleyvag/axiom",
    status: "building",
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
    manifest.links.repository !== expected.repository
  ) {
    throw new Error(
      `Source manifest does not match the approved C3 record: ${id}`,
    );
  }
  if (id === "relay") {
    if (
      manifest.links.demo !== null ||
      manifest.links.methodology !==
        "https://github.com/diegoaleyvag/relay/blob/main/docs/failure-semantics.md"
    ) {
      throw new Error(
        "Relay must retain a null demo and its approved methodology URL",
      );
    }
    return;
  }
  if (manifest.links.demo !== null) {
    throw new Error(`${id} must retain a null demo link`);
  }
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
  if ((await git(directory, "branch", "--show-current")) !== SOURCE_BRANCH) {
    throw new Error(`Source branch is not ${SOURCE_BRANCH}: ${id}`);
  }
  const commit = await git(directory, "rev-parse", "HEAD");
  if ("commit" in expected && commit !== expected.commit) {
    throw new Error(`Source commit mismatch for ${id}: ${commit}`);
  }
  if ("commitPrefix" in expected && !commit.startsWith(expected.commitPrefix)) {
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

async function main(): Promise<void> {
  const workspaceIndex = process.argv.indexOf("--workspace");
  const workspace =
    workspaceIndex === -1 ? undefined : process.argv[workspaceIndex + 1];
  if (workspace === undefined) {
    throw new Error(
      "Usage: pnpm decisions:sync --workspace <repositories-directory>",
    );
  }

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

await main();
