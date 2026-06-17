#!/usr/bin/env node
/**
 * Guard against Supabase migration version collisions.
 *
 * The Supabase CLI tracks each migration by its "version" — the leading numeric
 * token before the first underscore in the filename — and stores it in a table
 * whose PRIMARY KEY is `version`. Two migrations that share a leading token
 * therefore abort `supabase db reset` / `start` / `db push` with:
 *   ERROR: duplicate key ... "schema_migrations_pkey" ... Key (version)=(...)
 *
 * This script reads supabase/migrations/, extracts each leading version token,
 * and EXITS NON-ZERO listing any duplicates so CI fails the build before merge.
 */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
);

/** Leading numeric token before the first underscore — the CLI's "version". */
function versionOf(filename) {
  return filename.split("_")[0];
}

function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const filesByVersion = new Map();
  for (const file of files) {
    const version = versionOf(file);
    const bucket = filesByVersion.get(version) ?? [];
    bucket.push(file);
    filesByVersion.set(version, bucket);
  }

  const collisions = [...filesByVersion.entries()].filter(
    ([, bucket]) => bucket.length > 1,
  );

  if (collisions.length > 0) {
    console.error(
      `✗ Migration version collision detected (${collisions.length} version(s) used by >1 file):\n`,
    );
    for (const [version, bucket] of collisions) {
      console.error(`  version "${version}":`);
      for (const file of bucket) console.error(`    - ${file}`);
    }
    console.error(
      "\nEach migration needs a UNIQUE leading version token. Create migrations with",
    );
    console.error(
      "`supabase migration new <description>` (full 14-digit UTC YYYYMMDDHHMMSS_*).",
    );
    console.error("See supabase/migrations/README.md.");
    process.exit(1);
  }

  console.log(
    `✓ ${files.length} migrations, all version tokens unique.`,
  );
}

main();
