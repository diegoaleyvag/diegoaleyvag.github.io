import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// The public domain is not finalized (pending Diego's Vercel project
// confirmation), so `site` is sourced from the environment with a safe local
// fallback rather than a hardcoded guess. Set SITE_URL in the real Vercel
// project once the domain is confirmed.
const siteUrl = process.env["SITE_URL"] ?? "https://diegoaleyvag.vercel.app";

export default defineConfig({
  site: siteUrl,
  base: "/",
  output: "static",
  adapter: vercel(),
  build: {
    format: "directory",
  },
});
