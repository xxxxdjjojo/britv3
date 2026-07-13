import { describe, it, expect } from "vitest";
import {
  type AdminRole,
  type AdminPermission,
  hasPermission,
  getPermissionsForRole,
  getAccessibleNavGroups,
  ADMIN_ROLES,
} from "@/lib/admin-permissions";

describe("admin-permissions", () => {
  describe("hasPermission", () => {
    it("super_admin has all permissions", () => {
      expect(hasPermission("super_admin", "manage_users")).toBe(true);
      expect(hasPermission("super_admin", "manage_team")).toBe(true);
      expect(hasPermission("super_admin", "view_revenue")).toBe(true);
      expect(hasPermission("super_admin", "send_campaigns")).toBe(true);
      expect(hasPermission("super_admin", "manage_gdpr")).toBe(true);
    });

    it("moderation_admin can moderate but not manage team", () => {
      expect(hasPermission("moderation_admin", "moderate_listings")).toBe(true);
      expect(hasPermission("moderation_admin", "moderate_reviews")).toBe(true);
      expect(hasPermission("moderation_admin", "moderate_content")).toBe(true);
      expect(hasPermission("moderation_admin", "manage_cms")).toBe(true);
      expect(hasPermission("moderation_admin", "manage_team")).toBe(false);
      expect(hasPermission("moderation_admin", "view_revenue")).toBe(false);
      expect(hasPermission("moderation_admin", "manage_gdpr")).toBe(false);
      expect(hasPermission("moderation_admin", "send_campaigns")).toBe(false);
    });

    it("ops_admin can manage users and GDPR but not CMS", () => {
      expect(hasPermission("ops_admin", "manage_users")).toBe(true);
      expect(hasPermission("ops_admin", "manage_gdpr")).toBe(true);
      expect(hasPermission("ops_admin", "view_audit_log")).toBe(true);
      expect(hasPermission("ops_admin", "manage_subscriptions")).toBe(true);
      expect(hasPermission("ops_admin", "manage_cms")).toBe(false);
      expect(hasPermission("ops_admin", "manage_feature_flags")).toBe(false);
      expect(hasPermission("ops_admin", "view_revenue")).toBe(false);
    });

    it("dev_admin can manage flags and system but not user PII", () => {
      expect(hasPermission("dev_admin", "manage_feature_flags")).toBe(true);
      expect(hasPermission("dev_admin", "view_system_health")).toBe(true);
      expect(hasPermission("dev_admin", "view_api_usage")).toBe(true);
      expect(hasPermission("dev_admin", "view_analytics")).toBe(true);
      expect(hasPermission("dev_admin", "manage_users")).toBe(false);
      expect(hasPermission("dev_admin", "manage_gdpr")).toBe(false);
      expect(hasPermission("dev_admin", "moderate_listings")).toBe(false);
    });

    it("only super_admin and dev_admin can manage the status page", () => {
      expect(hasPermission("super_admin", "manage_status_page")).toBe(true);
      expect(hasPermission("dev_admin", "manage_status_page")).toBe(true);
      expect(hasPermission("moderation_admin", "manage_status_page")).toBe(false);
      expect(hasPermission("ops_admin", "manage_status_page")).toBe(false);
    });

    it("returns false for unknown role", () => {
      expect(hasPermission("unknown" as AdminRole, "manage_users")).toBe(false);
    });
  });

  describe("getAccessibleNavGroups", () => {
    it("super_admin sees all nav groups", () => {
      const groups = getAccessibleNavGroups("super_admin");
      expect(groups).toContain("Overview");
      expect(groups).toContain("Moderation");
      expect(groups).toContain("Operations");
      expect(groups).toContain("Content");
      expect(groups).toContain("Growth");
      expect(groups).toContain("Team");
    });

    it("moderation_admin does not see Growth or Team", () => {
      const groups = getAccessibleNavGroups("moderation_admin");
      expect(groups).toContain("Moderation");
      expect(groups).toContain("Content");
      expect(groups).not.toContain("Growth");
      expect(groups).not.toContain("Team");
    });
  });

  describe("ADMIN_ROLES", () => {
    it("defines exactly 4 roles", () => {
      expect(ADMIN_ROLES).toHaveLength(4);
    });
  });
});
