import type { NextConfig } from "next";
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
  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins = config.plugins ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.plugins.push(new EnsureBrowserCssPlugin() as any);
    }
    return config;
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
      { source: "/signup", destination: "/register", permanent: false },
      {
        source: "/dashboard/service_provider/:path*",
        destination: "/dashboard/provider/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
