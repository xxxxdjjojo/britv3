import { describe, expect, it } from "vitest";
import {
  hasConfiguredAdminAccess,
  resolveDashboardDestination,
} from "./admin-access";

describe("admin access helpers", () => {
  it("treats is_admin plus a valid admin_role as configured admin access", () => {
    expect(
      hasConfiguredAdminAccess({
        active_role: "homebuyer",
        is_admin: true,
        admin_role: "super_admin",
      }),
    ).toBe(true);
  });

  it("does not treat is_admin without admin_role as configured admin access", () => {
    expect(
      hasConfiguredAdminAccess({
        active_role: "homebuyer",
        is_admin: true,
        admin_role: null,
      }),
    ).toBe(false);
  });

  it("sends a configured admin to the admin console", () => {
    expect(
      resolveDashboardDestination({
        active_role: "homebuyer",
        is_admin: true,
        admin_role: "super_admin",
      }),
    ).toBe("/admin");
  });

  it("sends an incomplete admin configuration to forbidden", () => {
    expect(
      resolveDashboardDestination({
        active_role: "homebuyer",
        is_admin: true,
        admin_role: null,
      }),
    ).toBe("/forbidden");
  });

  it("sends a normal homebuyer to the homebuyer dashboard", () => {
    expect(
      resolveDashboardDestination({
        active_role: "homebuyer",
        is_admin: false,
        admin_role: null,
      }),
    ).toBe("/dashboard/homebuyer");
  });

  it("uses route slugs for service provider and broker product roles", () => {
    expect(
      resolveDashboardDestination({
        active_role: "service_provider",
        is_admin: false,
        admin_role: null,
      }),
    ).toBe("/dashboard/provider");
    expect(
      resolveDashboardDestination({
        active_role: "mortgage_broker",
        is_admin: false,
        admin_role: null,
      }),
    ).toBe("/dashboard/broker");
  });

  it("sends profiles without an active role to role selection", () => {
    expect(
      resolveDashboardDestination({
        active_role: null,
        is_admin: false,
        admin_role: null,
      }),
    ).toBe("/register/role-select");
  });
});
