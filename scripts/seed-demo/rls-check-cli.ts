#!/usr/bin/env tsx
/**
 * Seed Demo — RLS Check CLI Runner
 *
 * Usage:
 *   pnpm seed:rls-check
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
 */

import { checkRLS } from "./rls-check";

async function main(): Promise<void> {
  console.log("\n============================================================");
  console.log("  RLS VISIBILITY CHECK");
  console.log("============================================================");

  const { passed, failed } = await checkRLS();

  console.log("\n============================================================");
  console.log(`  Result: ${passed} passed, ${failed} failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
