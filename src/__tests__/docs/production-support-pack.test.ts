import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Production-support pack contract (docs/production-support/* + docs/incidents/*).
 *
 * Written FIRST (TDD): asserts every numbered pack doc and incident doc exists, so the
 * pack stays navigable as later PRs fill in the stubs. Mirrors the existence-guard style
 * of src/__tests__/influence/phase1-surfaces.test.ts.
 */

const ROOT = path.resolve(__dirname, "..", "..", "..");
const PACK = path.join(ROOT, "docs", "production-support");
const INCIDENTS = path.join(ROOT, "docs", "incidents");

const PACK_DOCS = [
  "00-executive-summary.md",
  "01-architecture-map.md",
  "02-critical-journeys.md",
  "03-risk-register.md",
  "04-alerting.md",
  "05-observability.md",
  "06-support-model.md",
  "07-ai-support-agent.md",
  "08-testing-and-guard-layer.md",
  "09-alert-catalogue.md",
  "10-status-page-operations.md",
  "11-tier1-actions-and-audit.md",
  "12-dr-and-backups.md",
  "13-implementation-backlog.md",
  "14-open-risks.md",
];

const INCIDENT_DOCS = [
  "incident-response-plan.md",
  "post-incident-template.md",
  "comms-templates.md",
];

const nonEmpty = (p: string): boolean => existsSync(p) && readFileSync(p, "utf8").trim().length > 0;

describe("production-support pack", () => {
  it("has all 15 numbered pack docs, non-empty", () => {
    for (const doc of PACK_DOCS) {
      expect(nonEmpty(path.join(PACK, doc)), `missing/empty: docs/production-support/${doc}`).toBe(
        true,
      );
    }
  });

  it("has the three incident docs, non-empty", () => {
    for (const doc of INCIDENT_DOCS) {
      expect(nonEmpty(path.join(INCIDENTS, doc)), `missing/empty: docs/incidents/${doc}`).toBe(true);
    }
  });

  it("has no remaining STUB markers — every pack doc is filled as-built", () => {
    // The pack is complete: earlier PRs shipped stubs that pointed forward
    // ("STATUS: STUB — delivered in PR N"); PR 14 flips this guard from
    // "files exist" to "no placeholder remains".
    for (const doc of PACK_DOCS) {
      const body = readFileSync(path.join(PACK, doc), "utf8");
      expect(body, `stub marker still present: docs/production-support/${doc}`).not.toMatch(
        /STATUS:\s*STUB/i,
      );
    }
  });
});
