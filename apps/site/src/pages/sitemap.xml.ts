import type { APIRoute } from "astro";

import { loadDecisionManifests } from "@portfolio/decisions";
import { ROUTES, workDecisionPath } from "../lib/i18n";

// A prerendered static file (Astro's default in `output: "static"` mode) —
// no `prerender = false` here, so this never becomes the site's second
// dynamic route (AGENTS.md, ADR 0014). Every path below is a real,
// already-built page; nothing here is invented.
export const GET: APIRoute = async ({ site }) => {
  const manifests = await loadDecisionManifests();
  const base = site ?? new URL("https://diegoaleyvag.vercel.app/");

  const staticPaths = [
    ROUTES.home.en,
    ROUTES.home.es,
    ROUTES.work.en,
    ROUTES.work.es,
    ROUTES.resume.en,
    ROUTES.resume.es,
    ROUTES.archive.en,
    ROUTES.archive.es,
    ROUTES.governanceLab.en,
    ROUTES.governanceLab.es,
    ROUTES.ask.en,
    ROUTES.ask.es,
  ];

  const decisionPaths = manifests.flatMap(({ manifest }) => [
    workDecisionPath("en", manifest.id),
    workDecisionPath("es", manifest.id),
  ]);

  const urls = [...staticPaths, ...decisionPaths].map((path) =>
    new URL(path, base).toString(),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: { "content-type": "application/xml" },
  });
};
