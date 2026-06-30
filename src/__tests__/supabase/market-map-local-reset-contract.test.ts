import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPOINT_MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260619000000_market_map_repoint_price_paid_data.sql",
);

describe("market map hosted-data migration contract", () => {
  it("does not break fresh local db reset when hosted price_paid_data is absent", () => {
    const migration = readFileSync(REPOINT_MIGRATION, "utf8");

    expect(migration).toContain("to_regclass('public.price_paid_data')");
    expect(migration).toContain("price_paid_data is absent");
    expect(migration).toContain("leaving existing ppd_with_geography");
  });
});
