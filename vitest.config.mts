import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // "server-only" is a Next.js package that throws at runtime when imported
      // in a browser/test context. Alias it to a no-op so server modules can be
      // unit-tested without the Next.js runtime.
      "server-only": new URL("src/__tests__/__mocks__/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
