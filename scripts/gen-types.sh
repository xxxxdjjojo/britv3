#!/usr/bin/env bash
set -euo pipefail

# Generate TypeScript types from the linked Supabase project
echo "Generating Supabase types..."

npx supabase gen types typescript --linked \
  --schema public \
  > src/types/database.types.ts

echo "Types written to src/types/database.types.ts"
echo "Run 'pnpm tsc --noEmit' to verify type compatibility."
