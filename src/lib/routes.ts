import type { UserRole } from "@/types/auth";

const DASHBOARD_BASE_BY_ROLE = {
  homebuyer: "/dashboard/homebuyer",
  renter: "/dashboard/renter",
  seller: "/dashboard/seller",
  landlord: "/dashboard/landlord",
  agent: "/dashboard/agent",
  service_provider: "/dashboard/provider",
  mortgage_broker: "/dashboard/broker",
} as const satisfies Record<UserRole, string>;

export const ROUTES = {
  notifications: "/notifications",
  inbox: "/inbox",
  dashboard: {
    root: "/dashboard",
    broker: DASHBOARD_BASE_BY_ROLE.mortgage_broker,
  },
} as const;

export function dashboardPathForRole(role: UserRole, path = ""): string {
  const base = DASHBOARD_BASE_BY_ROLE[role];
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (path === "" || path === "/") {
    return base;
  }

  return `${base}${normalizedPath}`;
}

export function savedDashboardPathForRole(role: UserRole): string {
  if (role === "service_provider" || role === "mortgage_broker") {
    return ROUTES.dashboard.root;
  }

  return dashboardPathForRole(role, "saved");
}
