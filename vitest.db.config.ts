import { defineConfig } from "vitest/config";

// Dedicated config for the real-Postgres suite (`pnpm test:db`).
// Kept separate so the default `pnpm test` (include: src/**) never collects
// db-tests/, and so the docker-boot beforeAll gets a generous hook timeout.
export default defineConfig({
  test: {
    environment: "node",
    include: ["db-tests/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Each test file boots its own container; keep them sequential.
    fileParallelism: false,
  },
});
