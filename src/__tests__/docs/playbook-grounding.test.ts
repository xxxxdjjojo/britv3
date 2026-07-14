import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Playbook / runbook grounding guard (PR 10 — the anti-rot mechanism).
 *
 * Every feature playbook and runbook under docs/support/ carries YAML front-matter
 * that points at live code (`code_paths`), schema (`tables`), admin UI
 * (`admin_surfaces`), Tier-1 registry actions (`tier1_actions`) and alert rules
 * (`alert_rules`). This test parses that front-matter and asserts every reference
 * still resolves — so a rename or deletion that orphans a playbook fails CI instead
 * of rotting silently. Same philosophy as the route-manifest / orphan-route guards.
 */

const ROOT = path.resolve(__dirname, "..", "..", "..");
const FEATURES_DIR = path.join(ROOT, "docs", "support", "features");
const RUNBOOKS_DIR = path.join(ROOT, "docs", "support", "runbooks");

// Headings every playbook and runbook must carry, so the guard fails on a stub.
const REQUIRED_HEADINGS = [
  "## Symptoms",
  "## Detection",
  "## Diagnosis",
  "## Remediation",
  "## Verification",
  "## Escalation",
] as const;

// PR 10 delivers these; PR 11 extends the manifest. Keeps the guard non-vacuous.
const REQUIRED_FEATURE_PLAYBOOKS = [
  "auth/verification-email-not-received.md",
  "auth/password-reset-failing.md",
  "auth/mfa-lockout.md",
  "auth/oauth-callback-failures.md",
  "auth/jwt-claims-stale.md",
  "payments/stripe-webhook-failure-and-dlq.md",
  "payments/checkout-failing.md",
  "payments/subscription-entitlement-drift.md",
  "payments/connect-payout-failures.md",
  "payments/gocardless-mandate-failures.md",
  "payments/dunning-stuck.md",
  "payments/promo-code-issues.md",
  // PR 11 — email
  "email/resend-outage.md",
  "email/bounce-and-suppression.md",
  "email/lifecycle-drip-stuck.md",
  "email/resend-webhook-verify-failures.md",
  // PR 11 — files / storage
  "files/attachment-upload-failures.md",
  "files/storage-rls-denials.md",
  // PR 11 — AI
  "ai/anthropic-outage-or-429.md",
  "ai/ai-cost-anomaly.md",
  // PR 11 — DB / infra
  "infra/supabase-degraded.md",
  "infra/migration-drift.md",
  "infra/upstash-redis-down.md",
  "infra/inngest-backlog.md",
  "infra/vercel-deploy-rollback.md",
] as const;

const REQUIRED_RUNBOOKS = [
  "site-down.md",
  "database-down.md",
  "stripe-webhook-backlog-replay.md",
  "auth-outage.md",
  "deploy-rollback.md",
  // PR 11
  "email-outage.md",
  "redis-down.md",
  "inngest-backlog.md",
  "secret-rotation.md",
  "data-breach.md",
  "dr-restore.md",
] as const;

type FrontMatter = Readonly<{
  title: string;
  code_paths: readonly string[];
  tables: readonly string[];
  admin_surfaces: readonly string[];
  tier1_actions: readonly string[];
  alert_rules: readonly string[];
  last_verified_commit: string;
}>;

/** Minimal front-matter parser: `key: scalar`, inline `key: [a, b]`, and block `-` lists. */
function parseFrontMatter(source: string): Record<string, string | string[]> {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error("missing YAML front-matter");
  const out: Record<string, string | string[]> = {};
  const lines = match[1].split("\n");
  let currentKey: string | null = null;
  for (const raw of lines) {
    if (raw.trim() === "") continue;
    const listItem = raw.match(/^\s*-\s+(.+?)\s*$/);
    if (listItem && currentKey) {
      (out[currentKey] as string[]).push(stripQuotes(listItem[1]));
      continue;
    }
    const kv = raw.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (rest === "") {
      out[key] = [];
      currentKey = key;
    } else if (rest.startsWith("[")) {
      out[key] = rest
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
      currentKey = null;
    } else {
      out[key] = stripQuotes(rest);
      currentKey = null;
    }
  }
  return out;
}

const stripQuotes = (s: string): string => s.replace(/^["']|["']$/g, "");

function asFrontMatter(raw: Record<string, string | string[]>): FrontMatter {
  const list = (k: string): string[] => (Array.isArray(raw[k]) ? (raw[k] as string[]) : []);
  const scalar = (k: string): string => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  return {
    title: scalar("title"),
    code_paths: list("code_paths"),
    tables: list("tables"),
    admin_surfaces: list("admin_surfaces"),
    tier1_actions: list("tier1_actions"),
    alert_rules: list("alert_rules"),
    last_verified_commit: scalar("last_verified_commit"),
  };
}

/** All Tier-1 registry action keys, read from the registry source (single source of truth). */
function registryActionKeys(): Set<string> {
  const dir = path.join(ROOT, "src", "services", "admin", "tier1-actions");
  const keys = new Set<string>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
    const src = readFileSync(path.join(dir, file), "utf8");
    for (const m of src.matchAll(/key:\s*"([a-z0-9-]+)"/g)) keys.add(m[1]);
  }
  return keys;
}

/**
 * Every alert-rule key a playbook may cite: the literal `ruleKey` strings in
 * alert-rules.ts PLUS the diagnostic keys (diagnosticsToFindings maps diagnostic
 * key -> ruleKey), so both firing paths are covered.
 */
function knownAlertRuleKeys(): Set<string> {
  const keys = new Set<string>();
  const rules = readFileSync(path.join(ROOT, "src/services/alerts/alert-rules.ts"), "utf8");
  for (const m of rules.matchAll(/ruleKey:\s*"([a-z0-9._]+)"/g)) keys.add(m[1]);
  const diag = readFileSync(path.join(ROOT, "src/services/admin/diagnostics-service.ts"), "utf8");
  for (const m of diag.matchAll(/key:\s*"([a-z0-9._]+)"/g)) keys.add(m[1]);
  return keys;
}

/** Combined lowercased migration SQL — a `tables` entry must appear in a CREATE TABLE. */
function migrationsBlob(): string {
  const dir = path.join(ROOT, "supabase", "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n")
    .toLowerCase();
}

function walkMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

describe("playbook & runbook grounding", () => {
  it("has every required auth + payments playbook", () => {
    for (const rel of REQUIRED_FEATURE_PLAYBOOKS) {
      expect(existsSync(path.join(FEATURES_DIR, rel)), `missing playbook: features/${rel}`).toBe(
        true,
      );
    }
  });

  it("has every required critical runbook", () => {
    for (const rel of REQUIRED_RUNBOOKS) {
      expect(existsSync(path.join(RUNBOOKS_DIR, rel)), `missing runbook: runbooks/${rel}`).toBe(
        true,
      );
    }
  });

  const docs = [...walkMarkdown(FEATURES_DIR), ...walkMarkdown(RUNBOOKS_DIR)];
  const actionKeys = registryActionKeys();
  const alertKeys = knownAlertRuleKeys();
  const migrations = migrationsBlob();

  it("discovers playbooks/runbooks to validate", () => {
    expect(docs.length).toBeGreaterThanOrEqual(
      REQUIRED_FEATURE_PLAYBOOKS.length + REQUIRED_RUNBOOKS.length,
    );
  });

  for (const file of docs) {
    const rel = path.relative(ROOT, file);
    describe(rel, () => {
      const source = readFileSync(file, "utf8");
      const fm = asFrontMatter(parseFrontMatter(source));

      it("has required headings", () => {
        for (const heading of REQUIRED_HEADINGS) {
          expect(source.includes(heading), `${rel}: missing heading ${heading}`).toBe(true);
        }
      });

      it("has a title and last_verified_commit", () => {
        expect(fm.title.length, `${rel}: empty title`).toBeGreaterThan(0);
        expect(fm.last_verified_commit.length, `${rel}: empty last_verified_commit`).toBeGreaterThan(
          0,
        );
      });

      it("code_paths all exist on disk", () => {
        for (const p of fm.code_paths) {
          expect(existsSync(path.join(ROOT, p)), `${rel}: code_path not found: ${p}`).toBe(true);
        }
      });

      it("tables all appear in a migration", () => {
        for (const t of fm.tables) {
          expect(migrations.includes(t.toLowerCase()), `${rel}: table not in migrations: ${t}`).toBe(
            true,
          );
        }
      });

      it("tier1_actions all exist in the registry", () => {
        for (const a of fm.tier1_actions) {
          expect(actionKeys.has(a), `${rel}: unknown tier1_action: ${a}`).toBe(true);
        }
      });

      it("alert_rules all exist in alert-rules/diagnostics", () => {
        for (const r of fm.alert_rules) {
          expect(alertKeys.has(r), `${rel}: unknown alert_rule: ${r}`).toBe(true);
        }
      });
    });
  }
});
