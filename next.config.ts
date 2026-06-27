import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

/**
 * Webpack plugin: after emit, ensure .next/browser/default-stylesheet.css exists.
 * jsdom (bundled via @react-email or Sentry SSR) reads this file at runtime.
 * Turbopack generates it automatically but webpack doesn't.
 */
class EnsureBrowserCssPlugin {
  apply(compiler: { hooks: { afterEmit: { tap: (name: string, cb: () => void) => void } } }) {
    compiler.hooks.afterEmit.tap("EnsureBrowserCssPlugin", () => {
      const browserDir = resolve(process.cwd(), ".next", "browser");
      if (!existsSync(resolve(browserDir, "default-stylesheet.css"))) {
        mkdirSync(browserDir, { recursive: true });
        writeFileSync(resolve(browserDir, "default-stylesheet.css"), "/* placeholder for jsdom */");
      }
    });
  }
}

const nextConfig: NextConfig = {
  // @react-pdf/renderer uses Node.js APIs and cannot be bundled for SSR
  serverExternalPackages: ["@react-pdf/renderer"],
  // jsdom (pulled in server-side by isomorphic-dompurify, used in the messaging
  // sanitizer) reads `../../browser/default-stylesheet.css` relative to its
  // bundled chunk at runtime. EnsureBrowserCssPlugin writes that file into
  // `.next/browser/`, but output file tracing can't see the dynamic readFileSync,
  // so the asset was never copied into the serverless bundle — every route that
  // imports the sanitizer (e.g. GET /api/messages) threw ENOENT → 500 in prod.
  // Force-include it for all server routes so the inbox loads.
  outputFileTracingIncludes: {
    "/*": [".next/browser/default-stylesheet.css"],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins = config.plugins ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.plugins.push(new EnsureBrowserCssPlugin() as any);
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "posthog-js",
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard/landlord/portfolio",
        destination: "/dashboard/landlord/properties",
        permanent: true,
      },
      {
        source: "/dashboard/landlord/rent-collection",
        destination: "/dashboard/landlord/rent",
        permanent: true,
      },
      {
        source: "/dashboard/landlord/finances",
        destination: "/dashboard/landlord/finance/expenses",
        permanent: true,
      },
      { source: "/terms", destination: "/legal/terms", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/cookies", destination: "/legal/cookies", permanent: true },
      { source: "/accessibility", destination: "/legal/accessibility", permanent: true },
      { source: "/complaints", destination: "/legal/complaints", permanent: true },
      // /signup is now a real route (memo pivot v2) — invite-only seed
      // signup lives there. /register remains the canonical default.
      {
        source: "/dashboard/service_provider/:path*",
        destination: "/dashboard/provider/:path*",
        permanent: true,
      },
    ];
  },
};

const config = process.env.ANALYZE === "true" ? withBundleAnalyzer({ enabled: true })(nextConfig) : nextConfig;

export default config;
