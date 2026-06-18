#!/usr/bin/env bash
# Verify Cloudflare cache behavior after deploy.
# Usage: cloudflare/verify-cache.sh https://staging.example.com
set -euo pipefail

BASE="${1:?usage: verify-cache.sh <https-base-url>}"

hdr() { curl -sS -D - -o /dev/null "$@"; }

echo "== Static asset (expect cache-control immutable; cf-cache-status HIT after warmup) =="
# Discover one hashed static chunk from the homepage HTML
CHUNK=$(curl -sS "$BASE/" | grep -oE '/_next/static/[^"]+\.js' | head -1 || true)
if [ -n "${CHUNK:-}" ]; then
  hdr "$BASE$CHUNK" | grep -iE 'cf-cache-status|cache-control|content-encoding' || true
else
  echo "  (no static chunk found in homepage HTML)"
fi

echo
echo "== HTML (expect cf-cache-status BYPASS/DYNAMIC; not cached) =="
hdr "$BASE/" | grep -iE 'cf-cache-status|cache-control' || true

echo
echo "== Authed HTML must NOT be cached (simulate auth cookie) =="
hdr -H 'Cookie: sb-access-token=dummy' "$BASE/dashboard" | grep -iE 'cf-cache-status|cache-control' || true

echo
echo "== Compression / protocol =="
curl -sS -o /dev/null -w 'http_version=%{http_version}\n' --http3 "$BASE/" 2>/dev/null \
  || curl -sS -o /dev/null -w 'http_version=%{http_version}\n' "$BASE/"
