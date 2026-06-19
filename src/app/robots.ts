import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/settings/",
          "/inbox/",
          "/notifications/",
          "/profile/",
          "/auth/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/account-locked",
          "/account-suspended",
          "/session-expired",
          "/forbidden",
          "/maintenance",
          "/rate-limited",
          "/milestones/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
