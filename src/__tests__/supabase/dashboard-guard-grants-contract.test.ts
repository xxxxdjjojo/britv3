import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CONTRACT_MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260630210000_dashboard_guard_authenticated_grants.sql",
);

describe("dashboard guard authenticated grant contract", () => {
  it("grants authenticated users the dashboard read surfaces protected by RLS", () => {
    expect(existsSync(CONTRACT_MIGRATION)).toBe(true);

    const migration = readFileSync(CONTRACT_MIGRATION, "utf8");

    expect(migration).toContain("GRANT SELECT ON public.profiles TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.user_roles TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.consent_records TO authenticated");
    expect(migration).toContain("ON public.subscriptions TO authenticated");
    expect(migration).toContain("user_id");
    expect(migration).toContain("status");
    expect(migration).toContain("plan_name");
    expect(migration).toContain("GRANT SELECT ON public.properties TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.listings TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.saved_properties TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.tenancies TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.maintenance_requests TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.property_documents TO authenticated");
    expect(migration).toContain("GRANT SELECT ON public.deposit_registrations TO authenticated");
  });
});
