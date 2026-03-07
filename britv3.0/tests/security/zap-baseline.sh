#!/usr/bin/env bash
# =============================================================================
# OWASP ZAP Baseline Security Scan -- Britestate
# =============================================================================
#
# USAGE:
#   ./tests/security/zap-baseline.sh <target-url>
#
# EXAMPLES:
#   ./tests/security/zap-baseline.sh https://staging.britestate.com
#   ./tests/security/zap-baseline.sh https://britestate.com
#   ./tests/security/zap-baseline.sh http://localhost:3000
#
# REQUIREMENTS:
#   - Docker must be installed and running
#   - The target URL must be accessible from the machine running this script
#
# OUTPUT:
#   Reports are written to tests/security/zap-report/:
#   - report.html  HTML report (open in browser for full details)
#   - report.md    Markdown summary
#   - report.json  Machine-readable JSON (for CI integration)
#
# EXIT CODES:
#   0 = No alerts found
#   1 = Warnings found (check report for details, may be false positives)
#   2 = Failures found (action required before launch)
#
# CONFIGURATION:
#   Known false positives are suppressed via tests/security/zap-config.conf.
#   Add new rules to suppress there to keep this script clean.
#
# CI USAGE:
#   In GitHub Actions:
#     - name: ZAP Baseline Scan
#       run: ./tests/security/zap-baseline.sh $STAGING_URL
#       continue-on-error: true  # Review report even on warnings
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
if [[ $# -lt 1 ]]; then
  echo "Error: Target URL is required" >&2
  echo "Usage: $0 <target-url>" >&2
  echo "Example: $0 https://staging.britestate.com" >&2
  exit 1
fi

TARGET_URL="$1"

# Validate URL format
if [[ ! "$TARGET_URL" =~ ^https?:// ]]; then
  echo "Error: Target URL must start with http:// or https://" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/zap-report"
ZAP_CONFIG="$SCRIPT_DIR/zap-config.conf"
ZAP_IMAGE="zaproxy/zap-stable"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
  echo "Error: Docker is not installed or not in PATH" >&2
  echo "Install Docker: https://docs.docker.com/get-docker/" >&2
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "Error: Docker daemon is not running" >&2
  echo "Start Docker Desktop or run: sudo systemctl start docker" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
mkdir -p "$REPORT_DIR"

echo "=============================================="
echo "OWASP ZAP Baseline Security Scan"
echo "=============================================="
echo "Target:     $TARGET_URL"
echo "Report dir: $REPORT_DIR"
echo "ZAP image:  $ZAP_IMAGE"
echo "Config:     $ZAP_CONFIG"
echo "Started at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=============================================="
echo ""

# Pull latest ZAP image if not present
echo "Pulling ZAP Docker image..."
docker pull "$ZAP_IMAGE"
echo ""

# ---------------------------------------------------------------------------
# Run ZAP baseline scan
# ---------------------------------------------------------------------------
echo "Starting ZAP baseline scan..."
echo "(This typically takes 2-5 minutes)"
echo ""

# Mount the script directory so ZAP can:
# - Read zap-config.conf for rule suppressions
# - Write reports to zap-report/
docker run --rm \
  --name "zap-britestate-scan" \
  -v "$SCRIPT_DIR:/zap/wrk:rw" \
  "$ZAP_IMAGE" \
  zap-baseline.py \
  -t "$TARGET_URL" \
  -c "/zap/wrk/zap-config.conf" \
  -r "wrk/zap-report/report.html" \
  -w "wrk/zap-report/report.md" \
  -J "wrk/zap-report/report.json" \
  -I \
  -l WARN \
  2>&1

ZAP_EXIT_CODE=$?

# ---------------------------------------------------------------------------
# Report summary
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "Scan Complete"
echo "=============================================="
echo "Exit code: $ZAP_EXIT_CODE"

case $ZAP_EXIT_CODE in
  0)
    echo "Result: PASS -- No alerts found"
    ;;
  1)
    echo "Result: WARN -- Warnings found (review report)"
    ;;
  2)
    echo "Result: FAIL -- Failures found (action required)"
    ;;
  *)
    echo "Result: UNKNOWN -- Unexpected exit code $ZAP_EXIT_CODE"
    ;;
esac

echo ""
echo "Reports written to: $REPORT_DIR"
echo "  HTML: $REPORT_DIR/report.html"
echo "  MD:   $REPORT_DIR/report.md"
echo "  JSON: $REPORT_DIR/report.json"
echo ""

if [[ -f "$REPORT_DIR/report.html" ]]; then
  echo "Open in browser: file://$REPORT_DIR/report.html"
fi

echo "Completed at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=============================================="

exit $ZAP_EXIT_CODE
