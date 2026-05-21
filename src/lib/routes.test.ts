import { describe, expect, it } from "vitest";
import { ROUTES, dashboardPathForRole } from "./routes";

describe("canonical routes", () => {
  it("exposes canonical shared navigation routes", () => {
    expect(ROUTES.notifications).toBe("/notifications");
    expect(ROUTES.inbox).toBe("/inbox");
    expect(ROUTES.dashboard.broker).toBe("/dashboard/broker");
  });

  it("maps mortgage broker dashboards to the filesystem route", () => {
    expect(dashboardPathForRole("mortgage_broker")).toBe("/dashboard/broker");
  });

  it("does not expose legacy shared-navigation hrefs", () => {
    const serializedRoutes = JSON.stringify(ROUTES);

    expect(serializedRoutes).not.toContain("/messages");
    expect(serializedRoutes).not.toContain("/dashboard/notifications");
    expect(serializedRoutes).not.toContain("/dashboard/mortgage_broker");
  });
});
