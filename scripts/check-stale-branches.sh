#!/usr/bin/env bash
# Flags long-lived feature branches that have diverged from main and were never
# merged — the literal root cause of the market-map incident (a feature 18
# commits ahead of main, never merged, stranded on a branch nobody served).
#
# Usage: scripts/check-stale-branches.sh [max_ahead]
#   max_ahead  warn threshold for commits ahead of main (default 15)
#
# Exit code is 0 (advisory). Set STRICT=1 to fail CI when stale branches exist.
set -euo pipefail

MAX_AHEAD="${1:-15}"
BASE="${BASE_BRANCH:-main}"

git fetch --quiet origin "$BASE" 2>/dev/null || true

stale=0
echo "Branches not merged into ${BASE} (ahead > ${MAX_AHEAD}):"
echo "------------------------------------------------------------"

while IFS= read -r branch; do
  branch="${branch#"${branch%%[![:space:]]*}"}"   # ltrim
  [ -z "$branch" ] && continue
  case "$branch" in
    "$BASE"|"* "*|"("*) continue ;;
  esac
  ahead=$(git rev-list --count "${BASE}..${branch}" 2>/dev/null || echo 0)
  behind=$(git rev-list --count "${branch}..${BASE}" 2>/dev/null || echo 0)
  if [ "$ahead" -gt "$MAX_AHEAD" ]; then
    printf '  ⚠  %-45s ahead=%s behind=%s\n' "$branch" "$ahead" "$behind"
    stale=$((stale + 1))
  fi
done < <(git branch --no-merged "$BASE" --format='%(refname:short)')

echo "------------------------------------------------------------"
if [ "$stale" -eq 0 ]; then
  echo "✓ No stale feature branches."
else
  echo "Found ${stale} stale branch(es). Merge or close them to avoid drift."
  [ "${STRICT:-0}" = "1" ] && exit 1
fi
