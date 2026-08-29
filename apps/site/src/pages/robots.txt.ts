import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://diegoaleyvag.vercel.app/");
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL("sitemap.xml", base).toString()}\n`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
