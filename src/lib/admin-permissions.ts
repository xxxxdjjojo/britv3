export type AdminRole = "super_admin" | "moderation_admin" | "ops_admin" | "dev_admin";

export type AdminPermission =
  | "manage_users"
  | "ban_users"
  | "suspend_users"
  | "moderate_listings"
  | "moderate_reviews"
  | "moderate_content"
  | "manage_verifications"
  | "manage_gdpr"
  | "manage_subscriptions"
  | "manage_fraud"
  | "view_audit_log"
  | "manage_cms"
  | "manage_seo"
  | "send_campaigns"
  | "manage_promo_codes"
  | "view_revenue"
  | "manage_feature_flags"
  | "view_system_health"
  | "view_api_usage"
  | "view_analytics"
  | "manage_team"
  | "manage_roles";

export const ADMIN_ROLES: readonly AdminRole[] = [
  "super_admin",
  "moderation_admin",
  "ops_admin",
  "dev_admin",
] as const;

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: [
    "manage_users", "ban_users", "suspend_users",
    "moderate_listings", "moderate_reviews", "moderate_content", "manage_verifications",
    "manage_gdpr", "manage_subscriptions", "manage_fraud", "view_audit_log",
    "manage_cms", "manage_seo",
    "send_campaigns", "manage_promo_codes", "view_revenue",
    "manage_feature_flags", "view_system_health", "view_api_usage", "view_analytics",
    "manage_team", "manage_roles",
  ],
  moderation_admin: [
    "manage_users", "suspend_users",
    "moderate_listings", "moderate_reviews", "moderate_content", "manage_verifications",
    "manage_cms", "manage_seo",
    "view_audit_log",
  ],
  ops_admin: [
    "manage_users", "ban_users", "suspend_users",
    "manage_gdpr", "manage_subscriptions", "manage_fraud", "view_audit_log",
    "manage_verifications",
  ],
  dev_admin: [
    "manage_feature_flags", "view_system_health", "view_api_usage", "view_analytics",
    "view_audit_log",
  ],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function getPermissionsForRole(role: AdminRole): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

const NAV_GROUP_PERMISSIONS: Record<string, AdminPermission> = {
  "Overview": "view_analytics",
  "Moderation": "moderate_listings",
  "Operations": "manage_gdpr",
  "Content": "manage_cms",
  "Growth": "view_revenue",
  "Team": "manage_team",
};

export function getAccessibleNavGroups(role: AdminRole): string[] {
  return Object.entries(NAV_GROUP_PERMISSIONS)
    .filter(([, perm]) => hasPermission(role, perm))
    .map(([group]) => group);
}

export const ADMIN_ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin": "view_analytics",
  "/admin/users": "manage_users",
  "/admin/moderation": "moderate_listings",
  "/admin/verifications": "manage_verifications",
  "/admin/reviews": "moderate_reviews",
  "/admin/reported": "moderate_content",
  "/admin/roles": "manage_roles",
  "/admin/team": "manage_team",
  "/admin/audit-log": "view_audit_log",
  "/admin/system-health": "view_system_health",
  "/admin/api-usage": "view_api_usage",
  "/admin/feature-flags": "manage_feature_flags",
  "/admin/gdpr": "manage_gdpr",
  "/admin/fraud": "manage_fraud",
  "/admin/cms": "manage_cms",
  "/admin/seo": "manage_seo",
  "/admin/analytics": "view_analytics",
  "/admin/subscriptions": "manage_subscriptions",
  "/admin/placements": "manage_subscriptions",
  "/admin/placement-products": "manage_subscriptions",
  "/admin/promo-codes": "manage_promo_codes",
  "/admin/email-campaigns": "send_campaigns",
};
