import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated service worker
    "public/sw.js",
    // Test files: console allowed for debug output
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/__tests__/**",
    "**/test/**",
    "tests/**",
    "e2e/**",
    // Tooling/scripts outside the Next.js app
    "scripts/**",
    // Top-level lib/ is legacy tooling (not src/lib).
    "lib/**",
    // Supabase Edge Functions run on Deno; lint them with a separate config.
    "supabase/functions/**",
    // Legacy snapshot of the app.
    "britv3.0/**",
  ]),
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "info"] }],
    },
  },
]);

export default eslintConfig;
