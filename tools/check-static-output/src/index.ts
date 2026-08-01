import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const outputRoot = path.join(workspaceRoot, "apps/site/dist");

const requiredFiles = [
  ".nojekyll",
  "404.html",
  "index.html",
  "lab/replay/index.html",
  "resume/index.html",
  "replays/v1/manifest.json",
  "fonts/archivo-variable.woff2",
  "fonts/archivo-black.woff2",
] as const;

const selfHostedFonts = [
  "fonts/archivo-variable.woff2",
  "fonts/archivo-black.woff2",
] as const;

const allowedExtensions = new Set([
  ".avif",
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".png",
  ".svg",
  ".webp",
  ".woff2",
]);

const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg"]);

const forbiddenContent: readonly [label: string, pattern: RegExp][] = [
  ["Groq credential variable", /\bGROQ_API_KEY\b/i],
  [
    "client-exposed secret variable",
    /\b(?:NEXT_PUBLIC|PUBLIC)_[A-Z0-9_]*(?:KEY|PASSWORD|SECRET|TOKEN)\b/i,
  ],
  ["authorization header", /\bauthorization\s*[:=]\s*["']?bearer\b/i],
  ["credential-shaped Groq key", /\bgsk_[A-Za-z0-9_-]{16,}\b/],
  ["credential-shaped API key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["server-only runtime import", /(?:apps\/runtime|live-groq|node:fs)/i],
  ["server-only runtime switch", /\b(?:LIVE_EXECUTION_ENABLED|LLM_PROVIDER)\b/],
];

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
    fileStats = await stat(path.join(outputRoot, relativePath));
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

for (const requiredFile of requiredFiles) {
  await assertRegularFile(requiredFile);
}

try {
  await stat(path.join(outputRoot, "CNAME"));
  throw new Error("Static output must not contain CNAME");
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const files = await listFiles(outputRoot);
const externalSubresources: string[] = [];
const styleSources: string[] = [];

for (const relativePath of files) {
  if (
    relativePath !== ".nojekyll" &&
    !allowedExtensions.has(path.extname(relativePath).toLowerCase())
  ) {
    throw new Error(
      `Static output contains a disallowed file: ${relativePath}`,
    );
  }

  const extension = path.extname(relativePath).toLowerCase();
  if (!textExtensions.has(extension)) {
    continue;
  }

  const contents = await readFile(path.join(outputRoot, relativePath), "utf8");
  if (contents.includes('"/diegoaleyvag.github.io/')) {
    throw new Error(
      `Static output contains a repository-name base path in ${relativePath}`,
    );
  }
  for (const [label, pattern] of forbiddenContent) {
    if (pattern.test(contents)) {
      throw new Error(`Static output contains ${label} in ${relativePath}`);
    }
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

for (const route of ["index.html", "resume/index.html"]) {
  const html = await readFile(path.join(outputRoot, route), "utf8");
  if (/<script\b/i.test(html)) {
    throw new Error(`${route} must not ship client JavaScript`);
  }
}

for (const fontPath of selfHostedFonts) {
  const sourceFont = await readFile(
    path.join(workspaceRoot, "apps/site/public", fontPath),
  );
  const builtFont = await readFile(path.join(outputRoot, fontPath));
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

const homeHtml = await readFile(path.join(outputRoot, "index.html"), "utf8");
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

console.log(
  `Static output is valid (${files.length} files; self-hosted Archivo fonts present; no external subresources)`,
);
