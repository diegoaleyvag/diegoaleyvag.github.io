import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["tests/e2e/**", "**/dist/**", "**/node_modules/**"],
    fileParallelism: false,
    hookTimeout: 60_000,
    include: [
      "packages/**/test/**/*.test.ts",
      "tests/{contract,integration}/**/*.test.ts",
      "tools/**/test/**/*.test.ts",
    ],
    testTimeout: 30_000,
  },
});
