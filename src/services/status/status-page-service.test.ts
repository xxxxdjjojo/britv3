import { describe, expect, it } from "vitest";

import type { ServiceStatus } from "@/services/admin/health-service";

import { mapComponent, overallState, overallWithIncidents } from "./status-page-service";

/**
 * Status-page mapping logic (TDD, written first).
 *
 * The public status page must NEVER surface a ServiceStatus.error string, raw
 * latency, or the internal vendor name verbatim if we can help it. mapComponent
 * is the choke-point that strips those; overallState rolls components + the
 * external probe into a single customer-facing verdict.
 */

const up: ServiceStatus = { name: "Stripe", status: "up", latencyMs: 42 };
const degraded: ServiceStatus = { name: "PostHog", status: "degraded", latencyMs: 900 };
const down: ServiceStatus = {
  name: "Supabase DB",
  status: "down",
  latencyMs: null,
  error: "getaddrinfo ENOTFOUND xyzcompany.supabase.co",
};

describe("mapComponent", () => {
  it("maps known vendor names to public labels", () => {
    expect(mapComponent(up).label).toBe("Payments");
    expect(mapComponent(degraded).label).toBe("Analytics");
    expect(mapComponent(down).label).toBe("Website & database");
  });

  it("maps status to a public component state", () => {
    expect(mapComponent(up).state).toBe("operational");
    expect(mapComponent(degraded).state).toBe("degraded");
    expect(mapComponent(down).state).toBe("down");
  });

  it("NEVER carries the internal error string or hostname through", () => {
    const mapped = mapComponent(down);
    const serialized = JSON.stringify(mapped);
    expect(serialized).not.toContain("ENOTFOUND");
    expect(serialized).not.toContain("supabase.co");
    expect(serialized).not.toContain("error");
  });

  it("does not leak an unknown vendor name verbatim", () => {
    const unknown: ServiceStatus = { name: "InternalSecretService", status: "up", latencyMs: 1 };
    expect(mapComponent(unknown).label).not.toContain("InternalSecretService");
  });
});

describe("overallState", () => {
  const c = (state: "operational" | "degraded" | "down") => ({ key: "x", label: "X", state });

  it("is operational when all components are up and the probe is healthy", () => {
    expect(overallState([c("operational"), c("operational")], true)).toBe("operational");
  });

  it("is degraded when any component is degraded", () => {
    expect(overallState([c("operational"), c("degraded")], true)).toBe("degraded");
  });

  it("is an outage when any component is down", () => {
    expect(overallState([c("operational"), c("down")], true)).toBe("outage");
  });

  it("is an outage when the external probe reports down, even if pings look fine", () => {
    expect(overallState([c("operational")], false)).toBe("outage");
  });

  it("treats an unknown probe (null) as non-fatal", () => {
    expect(overallState([c("operational")], null)).toBe("operational");
  });
});

describe("overallWithIncidents", () => {
  it("leaves the verdict unchanged when there are no active incidents", () => {
    expect(overallWithIncidents("operational", [])).toBe("operational");
    expect(overallWithIncidents("degraded", [])).toBe("degraded");
  });

  it("escalates to outage for a live critical incident, even if pings are green", () => {
    expect(overallWithIncidents("operational", [{ severity: "critical" }])).toBe("outage");
  });

  it("escalates operational to degraded for a live major/minor incident", () => {
    expect(overallWithIncidents("operational", [{ severity: "major" }])).toBe("degraded");
    expect(overallWithIncidents("operational", [{ severity: "minor" }])).toBe("degraded");
  });

  it("never de-escalates below the component-derived verdict", () => {
    expect(overallWithIncidents("outage", [{ severity: "minor" }])).toBe("outage");
  });
});
