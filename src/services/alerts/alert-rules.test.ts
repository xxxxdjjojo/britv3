import { describe, expect, it } from "vitest";

import type { Diagnostic } from "@/services/admin/diagnostics-service";

import { diagnosticsToFindings, reconcile, uptimeFindings } from "./alert-rules";

const diag = (key: string, level: Diagnostic["level"], detail = "x"): Diagnostic => ({
  key,
  label: key,
  level,
  value: 1,
  detail,
});

describe("diagnosticsToFindings", () => {
  it("emits findings only for warn/critical diagnostics", () => {
    const findings = diagnosticsToFindings([
      diag("a", "ok"),
      diag("b", "unknown"),
      diag("c", "warn"),
      diag("d", "critical"),
    ]);
    expect(findings.map((f) => f.ruleKey)).toEqual(["c", "d"]);
    expect(findings.map((f) => f.severity)).toEqual(["warning", "critical"]);
  });

  it("never carries anything but counts/labels (no PII surface)", () => {
    const findings = diagnosticsToFindings([diag("email_failures_24h", "critical", "25 failed")]);
    const text = JSON.stringify(findings);
    expect(text).not.toMatch(/@/); // no email addresses
    expect(text).toContain("25 failed");
  });
});

describe("uptimeFindings", () => {
  it("fires critical when the last 3 probes all failed", () => {
    expect(uptimeFindings([false, false, false]).map((f) => f.ruleKey)).toEqual([
      "uptime.consecutive_failures",
    ]);
  });

  it("stays quiet with a recent success or too few probes", () => {
    expect(uptimeFindings([true, false, false])).toEqual([]);
    expect(uptimeFindings([false, false])).toEqual([]);
  });
});

describe("reconcile", () => {
  const f = (fp: string) => ({
    ruleKey: fp,
    fingerprint: fp,
    severity: "warning" as const,
    summary: "s",
    details: {},
  });

  it("opens new findings, keeps still-firing, resolves gone ones", () => {
    const r = reconcile(new Set(["a", "b"]), [f("b"), f("c")]);
    expect(r.toOpen.map((x) => x.fingerprint)).toEqual(["c"]);
    expect(r.stillFiring.map((x) => x.fingerprint)).toEqual(["b"]);
    expect(r.toResolve).toEqual(["a"]);
  });

  it("is idempotent: re-running with the same findings opens nothing", () => {
    const r = reconcile(new Set(["a", "b"]), [f("a"), f("b")]);
    expect(r.toOpen).toEqual([]);
    expect(r.toResolve).toEqual([]);
    expect(r.stillFiring).toHaveLength(2);
  });
});
