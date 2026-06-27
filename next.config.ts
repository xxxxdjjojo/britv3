import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // Packages that read their own on-disk assets via Node APIs and must NOT be
  // bundled into serverless chunks (the bundler rewrites their __dirname so the
  // assets ENOENT at runtime). Keeping them external lets `require()` resolve
  // them from node_modules, which Vercel's file tracing ships with the function.
  //   - @react-pdf/renderer: reads font files.
  //   - jsdom (pulled in by isomorphic-dompurify): reads default-stylesheet.css.
  //     Bundling it caused GET /api/messages?count_only=true to 500 on every
  //     request (the unread badge) — see src/lib/validation/sanitize-text.ts.
  serverExternalPackages: ["@react-pdf/renderer", "jsdom"],
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
