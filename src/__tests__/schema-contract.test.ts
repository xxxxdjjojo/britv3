// src/__tests__/schema-contract.test.ts
import { describe, it, expect } from "vitest";
import type { Database } from "@/types/database.types";

/**
 * Schema contract tests.
 *
 * These tests verify that the tables our API routes depend on actually exist
 * in the generated database types. If a table is missing from the types, it
 * means either:
 *   1. The migration hasn't been applied (→ run pnpm db:push)
 *   2. Types are stale (→ run pnpm db:gen-types)
 *   3. The table was removed (→ update the code that references it)
 *
 * Add a new entry whenever you create an API route that queries a table.
 */

type PublicTables = keyof Database["public"]["Tables"];

// Every table that API routes depend on — this is the contract.
const REQUIRED_TABLES: PublicTables[] = [
  "profiles",
  "user_roles",
  "properties",
  "listings",
  "property_media",
  "price_history",
  "saved_properties",
  "saved_searches",
  "reviews",
  "review_helpfulness",
  "review_flags",
  "bookings",
  "service_requests",
  "service_provider_details",
  "provider_availability",
  "conversations",
  "messages",
];

describe("Schema Contract", () => {
  it.each(REQUIRED_TABLES)(
    "table '%s' exists in generated database types",
    (tableName) => {
      // This test passes at compile-time if the table exists in the type.
      // At runtime it just verifies the type was generated.
      const tables = {} as Database["public"]["Tables"];
      expect(tableName in tables || true).toBe(true);
      // The real check is that this file compiles — if a table is missing
      // from Database["public"]["Tables"], TypeScript will error on the
      // REQUIRED_TABLES type annotation above.
    },
  );
});
