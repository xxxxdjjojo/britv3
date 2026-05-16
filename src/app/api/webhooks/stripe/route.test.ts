import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const STRIPE_WEBHOOK_ROUTE = join(ROOT, "src/app/api/webhooks/stripe/route.ts");
const BILLING_MIGRATION = join(ROOT, "supabase/migrations/20260315000000_billing_tables.sql");

describe("Stripe webhook idempotency contract", () => {
  it("claims webhook events with processed state instead of ignoreDuplicates", () => {
    const source = readFileSync(STRIPE_WEBHOOK_ROUTE, "utf8");

    expect(source).not.toContain("ignoreDuplicates: true");
    expect(source).toContain("claim_billing_event");
    expect(source).toContain("mark_billing_event_processed");
    expect(source).toContain("mark_billing_event_failed");
  });

  it("stores processed_at as completion time and tracks attempts", () => {
    const migration = readFileSync(BILLING_MIGRATION, "utf8");

    expect(migration).toMatch(/processed_at\s+TIMESTAMPTZ\b(?!\s+NOT NULL\s+DEFAULT now\(\))/i);
    expect(migration).toContain("attempt_count");
    expect(migration).toContain("last_error");
  });

  it("matches subscription upsert conflict target with a database uniqueness guarantee", () => {
    const migration = readFileSync(BILLING_MIGRATION, "utf8");

    expect(migration).toMatch(/UNIQUE\s*\(\s*user_id\s*\)/i);
  });

  it("uses deterministic Stripe idempotency keys for referral balance credits", () => {
    const source = readFileSync(STRIPE_WEBHOOK_ROUTE, "utf8");

    expect(source).toContain("idempotencyKey");
    expect(source).toContain("referral-credit");
  });
});
