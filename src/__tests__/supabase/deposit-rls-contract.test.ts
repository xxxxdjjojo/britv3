import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CONTRACT_MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260630162000_deposit_registrations_tenancy_owner_contract.sql",
);

describe("deposit registration ownership schema contract", () => {
  it("authorizes deposits through tenancy ownership instead of deposit_registrations.landlord_id", () => {
    expect(existsSync(CONTRACT_MIGRATION)).toBe(true);

    const migration = readFileSync(CONTRACT_MIGRATION, "utf8");

    expect(migration).toContain("DROP COLUMN IF EXISTS landlord_id");
    expect(migration).toContain("FROM public.tenancies");
    expect(migration).toContain("public.tenancies.landlord_id = auth.uid()");
    expect(migration).not.toContain("deposit_registrations.landlord_id = auth.uid()");
  });
});
