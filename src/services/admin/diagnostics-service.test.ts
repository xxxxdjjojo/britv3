import { describe, expect, it } from "vitest";

import {
  classifyDlqBacklog,
  classifyEmailFailures,
  classifyGdprAge,
  classifyProbeStaleness,
  getDiagnostics,
} from "./diagnostics-service";

/**
 * Deep-diagnostics logic (TDD). Classifiers are pure; getDiagnostics is
 * exercised against a fluent-mock Supabase client (no real DB).
 */

describe("classifiers", () => {
  it("classifyProbeStaleness: unknown / ok / warn / critical by age", () => {
    expect(classifyProbeStaleness(null)).toBe("unknown");
    expect(classifyProbeStaleness(5)).toBe("ok");
    expect(classifyProbeStaleness(30)).toBe("warn");
    expect(classifyProbeStaleness(60)).toBe("critical");
  });

  it("classifyDlqBacklog: any failed webhook is critical", () => {
    expect(classifyDlqBacklog(null)).toBe("unknown");
    expect(classifyDlqBacklog(0)).toBe("ok");
    expect(classifyDlqBacklog(1)).toBe("critical");
  });

  it("classifyEmailFailures: escalates with volume", () => {
    expect(classifyEmailFailures(null)).toBe("unknown");
    expect(classifyEmailFailures(2)).toBe("ok");
    expect(classifyEmailFailures(5)).toBe("warn");
    expect(classifyEmailFailures(20)).toBe("critical");
  });

  it("classifyGdprAge: null means none open (ok); escalates near the 30-day deadline", () => {
    expect(classifyGdprAge(null)).toBe("ok");
    expect(classifyGdprAge(10)).toBe("ok");
    expect(classifyGdprAge(20)).toBe("warn");
    expect(classifyGdprAge(26)).toBe("critical");
  });
});

type TableResult = { single?: { data: unknown; error: unknown }; count?: { count: number | null; error: unknown } };

function mockClient(config: Record<string, TableResult>) {
  return {
    from(table: string) {
      const result = config[table] ?? {};
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      for (const m of ["select", "order", "limit", "eq", "in", "gte"]) builder[m] = chain;
      builder.maybeSingle = () => Promise.resolve(result.single ?? { data: null, error: null });
      builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(result.count ?? { count: 0, error: null }).then(resolve, reject);
      return builder;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

describe("getDiagnostics", () => {
  it("reports all-ok on a healthy platform", async () => {
    const client = mockClient({
      uptime_checks: { single: { data: { checked_at: iso(5 * MIN) }, error: null } },
      billing_events: { count: { count: 0, error: null } },
      email_logs: { count: { count: 0, error: null } },
      gdpr_requests: { single: { data: null, error: null } },
    });
    const diagnostics = await getDiagnostics(client);
    expect(diagnostics.every((d) => d.level === "ok")).toBe(true);
    expect(diagnostics.map((d) => d.key)).toContain("stripe_dlq_backlog");
  });

  it("surfaces criticals: stale probe, DLQ backlog, email spike, GDPR near deadline", async () => {
    const client = mockClient({
      uptime_checks: { single: { data: { checked_at: iso(60 * MIN) }, error: null } },
      billing_events: { count: { count: 3, error: null } },
      email_logs: { count: { count: 25, error: null } },
      gdpr_requests: { single: { data: { created_at: iso(26 * DAY) }, error: null } },
    });
    const byKey = Object.fromEntries((await getDiagnostics(client)).map((d) => [d.key, d.level]));
    expect(byKey.uptime_probe_staleness).toBe("critical");
    expect(byKey.stripe_dlq_backlog).toBe("critical");
    expect(byKey.email_failures_24h).toBe("critical");
    expect(byKey.gdpr_deadline_risk).toBe("critical");
  });

  it("degrades to unknown (never throws) when a query errors", async () => {
    const client = mockClient({
      uptime_checks: { single: { data: null, error: { message: "boom" } } },
      billing_events: { count: { count: null, error: { message: "boom" } } },
      email_logs: { count: { count: null, error: { message: "boom" } } },
      gdpr_requests: { single: { data: null, error: { message: "boom" } } },
    });
    const diagnostics = await getDiagnostics(client);
    expect(diagnostics.find((d) => d.key === "uptime_probe_staleness")?.level).toBe("unknown");
    expect(diagnostics.find((d) => d.key === "stripe_dlq_backlog")?.level).toBe("unknown");
  });
});
