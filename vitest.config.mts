import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "happy-dom",
    setupFiles: ["src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    testTimeout: 30000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
    server: {
      deps: {
        inline: ["date-fns", "react-day-picker", "tus-js-client"],
      },
    },
  },
});
