import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
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
  // Exactly two Preact islands are ever allowed to hydrate (AGENTS.md,
  // frontend.mdc): the interactive capability map
  // (apps/site/src/features/capability-map/**) and the Ask Diego guide
  // (apps/site/src/features/ask-diego/**). No other route ships framework
  // JavaScript.
  integrations: [preact()],
  build: {
    format: "directory",
  },
  // The retired /lab/replay/ Replay lab (ADR 0014) becomes a permanent
  // redirect to the honestly-labelled Personal Governance Lab placeholder,
  // never a dead link. `trailingSlash` stays at its default "ignore", so
  // Astro's router already treats "/lab/replay" and "/lab/replay/" as the
  // same route — registering both here is a duplicate-route collision
  // (Astro warns, and a future version hard-errors), so only one is listed.
  redirects: {
    "/lab/replay": "/work/governance-lab/",
  },
});
