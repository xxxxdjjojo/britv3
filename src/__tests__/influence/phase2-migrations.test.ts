import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Structural guard for the Phase-2 data-layer migrations: every new public
 * table is public-read RLS (broadband_coverage pattern), refresh functions are
 * security definer + service-role only, suppression thresholds are declared,
 * and the prod-only price_paid_transactions table is always behind a
 * to_regclass guard so local `db reset` works.
 */

const MIGRATIONS = path.resolve(__dirname, "..", "..", "..", "supabase", "migrations");

const FILES = {
  realityGap: "20260702210504_reality_gap_snapshots.sql",
  timeToSell: "20260702210507_time_to_sell_snapshots.sql",
  metrics: "20260702210508_platform_metrics_daily.sql",
  uptime: "20260702210510_uptime_checks.sql",
} as const;

const read = (f: string): string => readFileSync(path.join(MIGRATIONS, f), "utf8");

describe.each(Object.entries(FILES))("migration %s", (_key, file) => {
  const sql = read(file);

  it("enables RLS with a public-read SELECT policy", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toMatch(/for select\s+to anon, authenticated/);
    expect(sql).toContain("using (true)");
  });

  it("grants select to anon/authenticated only (no public write grants)", () => {
    expect(sql).toMatch(/grant select on public\.\w+ to anon, authenticated, service_role/);
    expect(sql).not.toMatch(/grant (insert|update|delete|all)/i);
  });
});

describe.each([FILES.realityGap, FILES.timeToSell])(
  "refresh function in %s",
  (file) => {
    const sql = read(file);

    it("is security definer with a pinned search_path", () => {
      expect(sql).toContain("security definer");
      expect(sql).toContain("set search_path = public");
    });

    it("is service-role only (revoked from public/anon/authenticated)", () => {
      expect(sql).toMatch(/revoke execute on function [\s\S]*?from public, anon, authenticated/);
      expect(sql).toMatch(/grant execute on function [\s\S]*?to service_role/);
    });

    it("declares disclosed suppression thresholds", () => {
      expect(sql).toMatch(/c_min_\w+ constant int/);
      expect(sql).toContain("suppressed");
    });

    it("recomputes a single period only (no blanket truncate)", () => {
      expect(sql).toMatch(/delete from public\.\w+ where period = v_period/);
      expect(sql).not.toMatch(/truncate/i);
    });
  },
);

describe("prod-only table guards", () => {
  it("reality-gap guards every price_paid_transactions access behind to_regclass", () => {
    const sql = read(FILES.realityGap);
    expect(sql).toContain("to_regclass('public.price_paid_transactions')");
  });

  it("no migration references price_paid_data (the unguarded legacy name)", () => {
    for (const file of Object.values(FILES)) {
      expect(read(file), `${file} references price_paid_data`).not.toMatch(
        /price_paid_data/,
      );
    }
  });

  it("two-tier vocabulary is pinned (matched_pair / area_median, never blended)", () => {
    const sql = read(FILES.realityGap);
    expect(sql).toContain("'matched_pair'");
    expect(sql).toContain("'area_median'");
  });
});
