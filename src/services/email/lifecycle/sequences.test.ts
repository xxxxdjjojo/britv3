import { describe, expect, it } from "vitest";
import {
  LIFECYCLE_SEQUENCES,
  LIFECYCLE_ROLES,
  toLifecycleRole,
  type LifecycleRole,
} from "./sequences";

const EXPECTED_COUNTS: Record<LifecycleRole, number> = {
  renter: 5,
  homebuyer: 5,
  landlord: 6,
  seller: 5,
  agent: 6,
};

describe("LIFECYCLE_SEQUENCES", () => {
  it("defines all five roles", () => {
    expect(LIFECYCLE_ROLES.sort()).toEqual(
      ["agent", "homebuyer", "landlord", "renter", "seller"].sort(),
    );
  });

  it.each(Object.entries(EXPECTED_COUNTS))(
    "%s sequence has the expected step count",
    (role, count) => {
      expect(LIFECYCLE_SEQUENCES[role as LifecycleRole]).toHaveLength(count);
    },
  );

  it.each(LIFECYCLE_ROLES)("%s delays are strictly increasing", (role) => {
    const delays = LIFECYCLE_SEQUENCES[role].map((s) => s.delayDays);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
  });

  it.each(LIFECYCLE_ROLES)("%s day-0 step is onboarding (always-send)", (role) => {
    const first = LIFECYCLE_SEQUENCES[role][0];
    expect(first.delayDays).toBe(0);
    expect(first.kind).toBe("onboarding");
  });

  it.each(LIFECYCLE_ROLES)("%s steps have non-empty subjects and unique keys", (role) => {
    const steps = LIFECYCLE_SEQUENCES[role];
    const keys = new Set<string>();
    for (const step of steps) {
      expect(step.subject.trim().length).toBeGreaterThan(0);
      expect(step.previewText.trim().length).toBeGreaterThan(0);
      expect(step.heading.trim().length).toBeGreaterThan(0);
      expect(step.paragraphs.length).toBeGreaterThan(0);
      expect(step.ctaLabel.trim().length).toBeGreaterThan(0);
      expect(keys.has(step.key)).toBe(false);
      keys.add(step.key);
    }
  });

  it.each(LIFECYCLE_ROLES)("%s ctaHrefs are internal absolute paths", (role) => {
    for (const step of LIFECYCLE_SEQUENCES[role]) {
      // Internal: starts with "/" and is not protocol-relative or external.
      expect(step.ctaHref.startsWith("/")).toBe(true);
      expect(step.ctaHref.startsWith("//")).toBe(false);
      expect(step.ctaHref).not.toMatch(/^https?:\/\//);
    }
  });
});

describe("toLifecycleRole", () => {
  it("maps the five named roles to themselves", () => {
    for (const role of LIFECYCLE_ROLES) {
      expect(toLifecycleRole(role)).toBe(role);
    }
  });

  it("returns null for roles without a sequence", () => {
    expect(toLifecycleRole("service_provider")).toBeNull();
    expect(toLifecycleRole("mortgage_broker")).toBeNull();
    expect(toLifecycleRole("admin")).toBeNull();
    expect(toLifecycleRole(null)).toBeNull();
    expect(toLifecycleRole(undefined)).toBeNull();
  });
});
