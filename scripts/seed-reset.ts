#!/usr/bin/env tsx
/**
 * Seed Reset — Removes all demo data
 *
 * Usage:
 *   SEED_TARGET=local pnpm seed:reset
 *
 * Calls cleanup() which deletes all demo-seeded rows in reverse FK order
 * and removes demo auth users.
 */

import { createSupabaseAdmin } from "./seed-demo/utils";
import { cleanup } from "./seed-demo/cleanup";

async function main(): Promise<void> {
  const supabase = createSupabaseAdmin();
  await cleanup(supabase);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
