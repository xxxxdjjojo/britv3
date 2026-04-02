/**
 * Seed Demo — Utility Functions
 *
 * Date helpers, UK data generators, Supabase admin client factory,
 * and a generic seedTable() upsert utility.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase Admin Client
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase client using the service_role key.
 * Requires SEED_TARGET to be explicitly set to 'local' or 'staging'
 * as a safety guard against accidentally seeding production.
 */
export function createSupabaseAdmin(): SupabaseClient {
  const seedTarget = process.env.SEED_TARGET;

  if (!seedTarget || !["local", "staging"].includes(seedTarget)) {
    throw new Error(
      `SEED_TARGET must be set to 'local' or 'staging' (got: '${seedTarget ?? ""}').\n` +
        "This prevents accidentally seeding a production database.\n" +
        "Usage: SEED_TARGET=local pnpm seed-demo",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Generic Seed Table Utility
// ---------------------------------------------------------------------------

export type SeedResult = {
  success: boolean;
  count: number;
  error?: string;
};

/**
 * Upserts rows into a Supabase table with progress logging.
 * Uses `id` as the conflict column for upsert (idempotent re-runs).
 */
export async function seedTable(
  supabase: SupabaseClient,
  tableName: string,
  rows: Record<string, unknown>[],
): Promise<SeedResult> {
  if (rows.length === 0) {
    console.log(`  Seeding ${tableName}: 0 rows (skipped)`);
    return { success: true, count: 0 };
  }

  console.log(`  Seeding ${tableName}: ${rows.length} rows...`);

  const { error } = await supabase
    .from(tableName)
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error(`  ERROR seeding ${tableName}: ${error.message}`);
    return { success: false, count: 0, error: error.message };
  }

  console.log(`  Seeded ${tableName}: ${rows.length} rows`);
  return { success: true, count: rows.length };
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

/** Returns a Date that is `n` minutes before now. */
export function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}

/** Returns a Date that is `n` hours before now. */
export function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

/** Returns a Date that is `n` days before now. */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Returns a random Date between `start` and `end` (inclusive). */
export function randomDateBetween(start: Date, end: Date): Date {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return new Date(startMs + Math.random() * (endMs - startMs));
}

// ---------------------------------------------------------------------------
// UK Data Generators
// ---------------------------------------------------------------------------

/** Generates a random UK mobile phone number (07xxx xxx xxx format). */
export function randomUKPhone(): string {
  const prefix = "07";
  // Generate 9 random digits
  const digits = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return `${prefix}${digits}`;
}

/**
 * Common UK postcode area prefixes with realistic district numbers.
 * Each entry produces a valid postcode matching:
 *   ^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$
 */
const UK_POSTCODE_AREAS = [
  "SW1A", "EC1A", "W1D", "SE1", "N1", "E1", "NW1",
  "M1", "M60", "B1", "LS1", "L1", "BS1", "EH1",
  "CF10", "G1", "BN1", "OX1", "CB1", "BA1",
  "YO1", "EX1", "TR1", "NG1", "NE1", "SO14",
];

const POSTCODE_LETTERS = "ABDEFGHJLNPQRSTUWXYZ"; // Valid UK outward code letters

/** Generates a random valid UK postcode. */
export function randomPostcode(): string {
  const area = UK_POSTCODE_AREAS[Math.floor(Math.random() * UK_POSTCODE_AREAS.length)];
  const digit = Math.floor(Math.random() * 10);
  const letter1 = POSTCODE_LETTERS[Math.floor(Math.random() * POSTCODE_LETTERS.length)];
  const letter2 = POSTCODE_LETTERS[Math.floor(Math.random() * POSTCODE_LETTERS.length)];
  return `${area} ${digit}${letter1}${letter2}`;
}

// ---------------------------------------------------------------------------
// General Helpers
// ---------------------------------------------------------------------------

/** Pick a random element from an array. */
export function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a UUID v4 (for non-demo entities that need fresh IDs each run). */
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
