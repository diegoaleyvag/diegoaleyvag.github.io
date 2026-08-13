import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Astro's Vercel adapter writes the deployable static half of the build to
// `.vercel/output/static/`, not directly under `dist/` (see
// tools/check-vercel-output). This server only ever exercises prerendered
// routes in e2e tests, so serving that directory — the same one Vercel
// itself would serve as static files — keeps the test server matching the
// real deployable artifact.
const outputRoot = path.resolve(
  fileURLToPath(
    new URL("../../apps/site/.vercel/output/static/", import.meta.url),
  ),
);
const host = "127.0.0.1";
const port = 4173;

const contentTypes: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function resolveRequestPath(url: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(
      new URL(url, `http://${host}:${port}`).pathname,
    );
  } catch {
    return null;
  }

  const relativePath = pathname.endsWith("/")
    ? `${pathname.slice(1)}index.html`
    : pathname.slice(1);
  const candidate = path.resolve(outputRoot, relativePath);
  if (
    candidate !== outputRoot &&
    !candidate.startsWith(`${outputRoot}${path.sep}`)
  ) {
    return null;
  }
  return candidate;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const filePath = resolveRequestPath(request.url ?? "/");
  if (filePath === null) {
    response.writeHead(400);
    response.end("Invalid static path");
    return;
  }

  let fileStats;
  try {
    fileStats = await stat(filePath);
  } catch {
    response.writeHead(404);
    response.end("Static file not found");
    return;
  }
  if (!fileStats.isFile()) {
    response.writeHead(404);
    response.end("Static file not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": fileStats.size,
    "Content-Type":
      contentTypes[path.extname(filePath).toLowerCase()] ??
      "application/octet-stream",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Static test server listening at http://${host}:${port}`);
});

function closeServer(): void {
  server.close((error) => {
    if (error !== undefined) {
      throw error;
    }
    process.exit(0);
  });
}

process.once("SIGINT", closeServer);
process.once("SIGTERM", closeServer);
