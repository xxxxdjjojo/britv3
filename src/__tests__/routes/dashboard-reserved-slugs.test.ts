import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAppRoute } from "./route-manifest";

const RESERVED_DASHBOARD_ACTION_ROUTES = [
  {
    url: "/dashboard/agent/listings/create",
    expectedSuffix: "dashboard/agent/listings/create/page.tsx",
  },
  {
    url: "/dashboard/agent/listings/new",
    expectedSuffix: "dashboard/[role]/listings/new/page.tsx",
  },
  {
    url: "/dashboard/seller/listings/create",
    expectedSuffix: "dashboard/seller/listings/create/page.tsx",
  },
  {
    url: "/dashboard/rfqs/create",
    expectedSuffix: "dashboard/rfqs/create/page.tsx",
  },
  {
    url: "/dashboard/landlord/compliance/matrix",
    expectedSuffix: "dashboard/landlord/compliance/matrix/page.tsx",
  },
  {
    url: "/dashboard/landlord/compliance/upload",
    expectedSuffix: "dashboard/landlord/compliance/upload/page.tsx",
  },
  {
    url: "/dashboard/landlord/maintenance/new",
    expectedSuffix: "dashboard/landlord/maintenance/new/page.tsx",
  },
  {
    url: "/dashboard/landlord/properties/property-1/maintenance/new",
    expectedSuffix:
      "dashboard/landlord/properties/[id]/maintenance/new/page.tsx",
  },
] as const;

describe("dashboard reserved action slugs", () => {
  it.each(RESERVED_DASHBOARD_ACTION_ROUTES)(
    "resolves $url to the literal action page",
    ({ url, expectedSuffix }) => {
      const resolved = resolveAppRoute(url);
      const normalized = resolved?.split(path.sep).join("/");

      expect(normalized).toBeDefined();
      expect(normalized).toContain(`/src/app/(protected)/${expectedSuffix}`);
    },
  );
});
