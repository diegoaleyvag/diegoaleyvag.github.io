import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Validates the actual Vercel Build Output API v3 artifact (see ADR 0014 and
// docs/architecture.md), not the intermediate `apps/site/dist/` Astro writes
// on the way there. Vercel only ever reads `.vercel/output/{config.json,
// static/**, functions/*.func/**}`, so that is the deployable graph.
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const siteRoot = path.join(workspaceRoot, "apps/site");
const outputRoot = path.join(siteRoot, ".vercel/output");
const staticRoot = path.join(outputRoot, "static");
const functionsRoot = path.join(outputRoot, "functions");

// The one route this session wires up deliberately (AGENTS.md, ADR 0014).
const dynamicRoute = "/api/ask";

// Astro's Vercel adapter always reserves these path prefixes for its own
// on-demand machinery (server islands, the on-demand image endpoint), even
// when a project uses neither feature yet. They are the only other patterns
// allowed to reach the server function.
const reservedAstroInternalRoutePattern = /^\^\/(_image|_server-islands)\b/;

// frontend.mdc caps hydration at two Preact islands. This list is the
// enforcement point for that cap, and the only hand-maintained piece of an
// otherwise directory-driven scan: which routes may ship any first-party JS
// at all is a design decision, not something a directory walk can infer, so
// a short explicit allow-list is safer here than trying to derive it. The
// Ask Diego guide is the first of the two allowed islands (both its EN and
// ES routes hydrate the same component); a later workstream adds the map's
// route here as the second and last entry this rule ever allows.
const knownIslandRoutes = new Set<string>([
  "ask/index.html",
  "es/pregunta/index.html",
]);
if (knownIslandRoutes.size > 2) {
  throw new Error(
    "frontend.mdc caps hydration at two Preact islands — update the rule before this list",
  );
}
// Generous headroom for the shared Preact + hooks runtime chunk plus one
// island's own component code (see DESIGN.md's measured-cost reference
// point: ~7.7 KB gzip combined, well under this uncompressed ceiling).
const maxIslandRouteScriptBytes = 320 * 1024;

const requiredStaticFiles = [
  "404.html",
  "index.html",
  "resume/index.html",
  "work/governance-lab/index.html",
  "ask/index.html",
  "es/pregunta/index.html",
  "decisions/v1/manifest.json",
  "corpus/v1/manifest.json",
  "fonts/archivo-variable.woff2",
  "fonts/archivo-black.woff2",
] as const;

const selfHostedFonts = [
  "fonts/archivo-variable.woff2",
  "fonts/archivo-black.woff2",
] as const;

const allowedStaticExtensions = new Set([
  ".avif",
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".pdf",
  ".png",
  ".svg",
  ".webp",
  ".woff2",
]);

const staticTextExtensions = new Set([".css", ".html", ".js", ".json", ".svg"]);
const functionTextExtensions = new Set([".cjs", ".js", ".json", ".mjs"]);

// Secret-shape checks that apply everywhere (static output and the function
// bundle's own source). Kept deliberately provider-agnostic: the retired
// Groq-named checks (GROQ_API_KEY, LIVE_EXECUTION_ENABLED, LLM_PROVIDER) are
// gone with that seam (AGENTS.md); the Ask-Diego provider's real key name is
// chosen by a later workstream, so this stays generic rather than guessing.
const secretShapePatterns: readonly [label: string, pattern: RegExp][] = [
  [
    "client-exposed secret variable",
    /\b(?:NEXT_PUBLIC|PUBLIC)_[A-Z0-9_]*(?:KEY|PASSWORD|SECRET|TOKEN)\b/i,
  ],
  ["authorization header", /\bauthorization\s*[:=]\s*["']?bearer\b/i],
  ["credential-shaped API key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
];

// Only meaningful for code that is supposed to ship to the browser: the
// static output must never contain a server-only Node.js built-in import.
// The function bundle legitimately imports these, so this check is scoped to
// `static/` only (see checkStaticOutput below).
const serverOnlyImportPattern = /\bnode:[a-z][a-z0-9/_-]*\b/i;

interface VercelRoute {
  readonly handle?: string;
  readonly src?: string;
  readonly dest?: string;
  readonly status?: number;
  readonly continue?: boolean;
  readonly headers?: Record<string, string>;
}

interface VercelBuildOutputConfig {
  readonly version: number;
  readonly routes?: readonly VercelRoute[];
}

async function listFiles(
  directory: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

async function assertRegularFile(relativePath: string): Promise<void> {
  let fileStats;
  try {
    fileStats = await stat(path.join(staticRoot, relativePath));
  } catch {
    throw new Error(`Static output is missing ${relativePath}`);
  }
  if (!fileStats.isFile()) {
    throw new Error(`Static output path is not a file: ${relativePath}`);
  }
}

function readAttribute(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function isExternalResource(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value.trim());
}

function collectExternalSubresources(
  relativePath: string,
  html: string,
): string[] {
  const violations: string[] = [];
  const resourceTags =
    /<(?:audio|embed|iframe|img|object|script|source|video)\b[^>]*>/gi;

  for (const match of html.matchAll(resourceTags)) {
    const tag = match[0];
    for (const attribute of ["data", "poster", "src"]) {
      const value = readAttribute(tag, attribute);
      if (value !== undefined && isExternalResource(value)) {
        violations.push(`${relativePath}: ${value}`);
      }
    }
    const srcset = readAttribute(tag, "srcset");
    if (srcset !== undefined) {
      for (const candidate of srcset.split(",")) {
        const value = candidate.trim().split(/\s+/u)[0];
        if (value !== undefined && isExternalResource(value)) {
          violations.push(`${relativePath}: ${value}`);
        }
      }
    }
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = readAttribute(tag, "rel")?.toLowerCase().split(/\s+/u) ?? [];
    const requestsResource = rel.some((value) =>
      [
        "dns-prefetch",
        "icon",
        "manifest",
        "modulepreload",
        "preconnect",
        "prefetch",
        "preload",
        "stylesheet",
      ].includes(value),
    );
    const href = readAttribute(tag, "href");
    if (requestsResource && href !== undefined && isExternalResource(href)) {
      violations.push(`${relativePath}: ${href}`);
    }
  }

  return violations;
}

function assertNoExternalCssResources(
  relativePath: string,
  contents: string,
): void {
  const externalReference =
    /(?:@import\s+(?:url\()?\s*|url\(\s*)["']?(?:https?:)?\/\//i;
  if (externalReference.test(contents)) {
    throw new Error(
      `Static output contains an external CSS/font/CDN request in ${relativePath}`,
    );
  }
}

function collectScriptBytes(
  relativePath: string,
  html: string,
  fileSizes: ReadonlyMap<string, number>,
): number {
  let totalBytes = 0;
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const [tag, inlineContent] = match;
    if (tag === undefined) {
      continue;
    }
    const src = readAttribute(tag, "src");
    if (src === undefined) {
      totalBytes += Buffer.byteLength(inlineContent ?? "", "utf8");
      continue;
    }
    if (isExternalResource(src)) {
      throw new Error(`${relativePath} loads a third-party script: ${src}`);
    }
    const assetSize = fileSizes.get(src);
    if (assetSize === undefined) {
      throw new Error(
        `${relativePath} references a script not found in the static output: ${src}`,
      );
    }
    totalBytes += assetSize;
  }
  return totalBytes;
}

async function checkStaticOutput(): Promise<{
  readonly routeFiles: readonly string[];
}> {
  for (const requiredFile of requiredStaticFiles) {
    await assertRegularFile(requiredFile);
  }

  const files = await listFiles(staticRoot);
  const externalSubresources: string[] = [];
  const styleSources: string[] = [];
  const fileSizes = new Map<string, number>();

  for (const relativePath of files) {
    const fileStats = await stat(path.join(staticRoot, relativePath));
    fileSizes.set(`/${relativePath}`, fileStats.size);

    if (
      !allowedStaticExtensions.has(path.extname(relativePath).toLowerCase())
    ) {
      throw new Error(
        `Static output contains a disallowed file: ${relativePath}`,
      );
    }

    const extension = path.extname(relativePath).toLowerCase();
    if (!staticTextExtensions.has(extension)) {
      continue;
    }

    const contents = await readFile(
      path.join(staticRoot, relativePath),
      "utf8",
    );
    for (const [label, pattern] of secretShapePatterns) {
      if (pattern.test(contents)) {
        throw new Error(`Static output contains ${label} in ${relativePath}`);
      }
    }
    if (serverOnlyImportPattern.test(contents)) {
      throw new Error(
        `Static output contains a server-only Node.js built-in import in ${relativePath}`,
      );
    }

    if (extension === ".html") {
      externalSubresources.push(
        ...collectExternalSubresources(relativePath, contents),
      );
      assertNoExternalCssResources(relativePath, contents);
      styleSources.push(contents);
    } else if (extension === ".css") {
      assertNoExternalCssResources(relativePath, contents);
      styleSources.push(contents);
    }
  }

  if (externalSubresources.length > 0) {
    throw new Error(
      `Static output contains external subresource requests:\n${externalSubresources.join(
        "\n",
      )}`,
    );
  }

  const routeFiles = files.filter((file) => file.endsWith(".html"));
  for (const relativePath of routeFiles) {
    const html = await readFile(path.join(staticRoot, relativePath), "utf8");
    const scriptBytes = collectScriptBytes(relativePath, html, fileSizes);
    if (knownIslandRoutes.has(relativePath)) {
      if (scriptBytes > maxIslandRouteScriptBytes) {
        throw new Error(
          `${relativePath} ships ${scriptBytes} bytes of first-party JS, over the ${maxIslandRouteScriptBytes}-byte island budget`,
        );
      }
    } else if (scriptBytes > 0 || /<script\b/i.test(html)) {
      throw new Error(
        `${relativePath} ships client JavaScript but is not a known Preact-island route`,
      );
    }
  }

  for (const fontPath of selfHostedFonts) {
    const sourceFont = await readFile(path.join(siteRoot, "public", fontPath));
    const builtFont = await readFile(path.join(staticRoot, fontPath));
    if (builtFont.byteLength === 0 || !builtFont.equals(sourceFont)) {
      throw new Error(
        `Built font ${fontPath} is absent, empty, or differs from its self-hosted source`,
      );
    }
  }

  const combinedStyles = styleSources.join("\n");
  if (!/@font-face/i.test(combinedStyles)) {
    throw new Error("Built CSS does not declare any self-hosted @font-face");
  }
  for (const fontPath of selfHostedFonts) {
    const escapedPath = fontPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const urlPattern = new RegExp(`url\\(["']?/${escapedPath}["']?\\)`, "i");
    if (!urlPattern.test(combinedStyles)) {
      throw new Error(`Built CSS does not self-host ${fontPath} from /fonts/`);
    }
  }
  if (
    !/--font-display\s*:[^;}]*Archivo Black[^;}]*Archivo[^;}]*sans-serif/i.test(
      combinedStyles,
    ) ||
    !/--font-body\s*:[^;}]*Archivo[^;}]*sans-serif/i.test(combinedStyles)
  ) {
    throw new Error(
      "Built --font-display/--font-body do not preserve the self-hosted Archivo stack with a sans-serif fallback",
    );
  }

  const homeHtml = await readFile(path.join(staticRoot, "index.html"), "utf8");
  const preloadedFontHrefs = new Set(
    [...homeHtml.matchAll(/<link\b[^>]*>/gi)]
      .filter(
        ([tag]) =>
          readAttribute(tag, "rel")?.toLowerCase() === "preload" &&
          readAttribute(tag, "as")?.toLowerCase() === "font",
      )
      .map(([tag]) => readAttribute(tag, "href")),
  );
  for (const fontPath of selfHostedFonts) {
    if (!preloadedFontHrefs.has(`/${fontPath}`)) {
      throw new Error(
        `Home output does not preload the self-hosted /${fontPath}`,
      );
    }
  }

  return { routeFiles };
}

async function checkFunctionBundle(): Promise<{
  readonly functionCount: number;
  readonly functionNames: readonly string[];
}> {
  const functionEntries = await readdir(functionsRoot, { withFileTypes: true });
  const functionDirs = functionEntries.filter(
    (entry) => entry.isDirectory() && entry.name.endsWith(".func"),
  );

  if (functionDirs.length !== 1) {
    throw new Error(
      `Expected exactly one server function, found ${functionDirs.length}: ${functionDirs
        .map((entry) => entry.name)
        .join(", ")}`,
    );
  }

  const [functionDir] = functionDirs;
  if (functionDir === undefined) {
    throw new Error("Expected exactly one server function directory");
  }
  const functionRoot = path.join(functionsRoot, functionDir.name);

  const vcConfigRaw = await readFile(
    path.join(functionRoot, ".vc-config.json"),
    "utf8",
  );
  const vcConfig = JSON.parse(vcConfigRaw) as { readonly runtime?: string };
  if (!vcConfig.runtime?.startsWith("nodejs")) {
    throw new Error(
      `Server function runtime is not Node.js: ${vcConfig.runtime ?? "(missing)"}`,
    );
  }

  const bundleFiles = await listFiles(functionRoot);
  for (const relativePath of bundleFiles) {
    const extension = path.extname(relativePath).toLowerCase();
    if (!functionTextExtensions.has(extension)) {
      continue;
    }
    const contents = await readFile(
      path.join(functionRoot, relativePath),
      "utf8",
    );
    for (const [label, pattern] of secretShapePatterns) {
      if (pattern.test(contents)) {
        throw new Error(
          `Server function bundle contains ${label} in ${relativePath}`,
        );
      }
    }
  }

  return {
    functionCount: functionDirs.length,
    functionNames: functionDirs.map((entry) =>
      entry.name.slice(0, -".func".length),
    ),
  };
}

async function checkRoutingConfig(
  functionNames: readonly string[],
): Promise<void> {
  const configRaw = await readFile(
    path.join(outputRoot, "config.json"),
    "utf8",
  );
  const config = JSON.parse(configRaw) as VercelBuildOutputConfig;
  const routes = config.routes ?? [];

  // The filesystem (prerendered files) must be checked before any dynamic
  // route, so a static route can never be shadowed by the function. A
  // permanent redirect — e.g. the retired /lab/replay/ page's redirect to
  // /work/governance-lab/ — is allowed ahead of that check: it never
  // competes with a static file for the same path, it only ever has a
  // Location header and a 3xx status, and it never has `dest`.
  const filesystemIndex = routes.findIndex(
    (route) => route.handle === "filesystem",
  );
  if (filesystemIndex === -1) {
    throw new Error(
      "config.json never checks the filesystem (prerendered files) before a dynamic route",
    );
  }
  for (const route of routes.slice(0, filesystemIndex)) {
    const isPermanentRedirect =
      route.dest === undefined &&
      route.status !== undefined &&
      route.status >= 300 &&
      route.status < 400 &&
      typeof route.headers?.["Location"] === "string";
    if (!isPermanentRedirect) {
      throw new Error(
        `config.json runs a non-redirect route before the filesystem check, so a static route could be shadowed: ${JSON.stringify(route)}`,
      );
    }
  }

  // Only routes destined for an actual server function matter here — the
  // catch-all 404 rewrite also sets `dest`, but to a static file, not a
  // function name.
  const dynamicRoutes = routes.filter(
    (route) =>
      route.dest !== undefined &&
      route.handle === undefined &&
      functionNames.includes(route.dest),
  );
  const unexpectedDynamicRoutes = dynamicRoutes.filter((route) => {
    const src = route.src ?? "";
    return (
      !reservedAstroInternalRoutePattern.test(src) &&
      !src.startsWith(`^${dynamicRoute}`)
    );
  });

  if (unexpectedDynamicRoutes.length > 0) {
    throw new Error(
      `config.json routes an unexpected pattern to a server function: ${unexpectedDynamicRoutes
        .map((route) => route.src)
        .join(", ")}`,
    );
  }

  const askRouteExists = dynamicRoutes.some((route) =>
    (route.src ?? "").startsWith(`^${dynamicRoute}`),
  );
  if (!askRouteExists) {
    throw new Error(`config.json does not route ${dynamicRoute} to a function`);
  }
}

const { routeFiles } = await checkStaticOutput();
const { functionCount, functionNames } = await checkFunctionBundle();
await checkRoutingConfig(functionNames);

console.log(
  `Vercel build output is valid (${routeFiles.length} prerendered routes; ${functionCount} server function scoped to ${dynamicRoute}; self-hosted Archivo fonts present; no external subresources)`,
);
