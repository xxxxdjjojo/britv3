import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function findFeedImportMigration(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    if (sql.includes("feed_import_runs")) {
      return sql.toLowerCase();
    }
  }

  return "";
}

describe("feed import ledger migration", () => {
  it("defines the durable feed import tables", () => {
    const sql = findFeedImportMigration();

    expect(sql).toContain("create table if not exists public.feed_import_runs");
    expect(sql).toContain("create table if not exists public.feed_import_items");
    expect(sql).toContain("create table if not exists public.feed_listing_links");
    expect(sql).toContain("create table if not exists public.feed_branch_links");
    expect(sql).toContain("create table if not exists public.feed_media_links");
  });

  it("enables RLS and tenant indexes on every import table", () => {
    const sql = findFeedImportMigration();

    for (const table of [
      "feed_import_runs",
      "feed_import_items",
      "feed_listing_links",
      "feed_branch_links",
      "feed_media_links",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      expect(sql).toContain(`idx_${table}_agent_id`);
      expect(sql).toContain(`policy \"${table}_agent_select\"`);
    }
  });

  it("adds idempotency constraints for runs, items, listing, branch, and media links", () => {
    const sql = findFeedImportMigration();

    expect(sql).toContain("unique (integration_id, source_fingerprint)");
    expect(sql).toContain("unique (run_id, item_type, external_id)");
    expect(sql).toContain("unique (integration_id, external_listing_id)");
    expect(sql).toContain("unique (integration_id, external_branch_id)");
    expect(sql).toContain("unique (integration_id, listing_id, external_media_id)");
  });
});
