import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://diegoaleyvag.github.io",
  base: "/",
  output: "static",
  build: {
    format: "directory",
  },
});
