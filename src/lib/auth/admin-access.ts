import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";
import { ROLE_TO_ROUTE } from "@/lib/constants";
import type { UserRole } from "@/types/auth";

export type AdminAccessProfile = {
  active_role?: UserRole | string | null;
  is_admin?: boolean | null;
  admin_role?: string | null;
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ROLE_TO_ROUTE, value)
  );
}

export function hasConfiguredAdminAccess(
  profile: Partial<AdminAccessProfile> | null | undefined,
): boolean {
  return profile?.is_admin === true && isAdminRole(profile.admin_role);
}

export function resolveDashboardDestination(
  profile: AdminAccessProfile | null | undefined,
): string {
  if (profile?.is_admin === true) {
    return hasConfiguredAdminAccess(profile) ? "/admin" : "/forbidden";
  }

  if (!isUserRole(profile?.active_role)) {
    return "/register/role-select";
  }

  return `/dashboard/${ROLE_TO_ROUTE[profile.active_role]}`;
}
