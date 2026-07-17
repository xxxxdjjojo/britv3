/**
 * Degradation tests for the dependency health pings (PR 12 backfill).
 *
 * The /admin/system-health panel is only trustworthy if a ping can never throw
 * and never falsely reports "up" during an outage. These tests pin the failure
 * modes: an unreachable dependency degrades to down/degraded (never an
 * exception), a missing config is reported honestly, and the aggregate deep
 * sweep survives one dependency being down.
 *
 * fetch is stubbed — no real network. All values are synthetic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pingSupabase,
  pingRedis,
  pingAnthropic,
  pingStripe,
  getDeepHealthStatus,
} from "@/services/admin/health-service";

function okStatusJson(indicator: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ status: { indicator } }),
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://synthetic.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon-key");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://synthetic.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "synthetic-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Unreachable dependency → down, never throws
// ---------------------------------------------------------------------------

describe("pings degrade instead of throwing when a dependency is unreachable", () => {
  it("pingSupabase reports down (not an exception) on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await pingSupabase();

    expect(result.status).toBe("down");
    expect(result.name).toBe("Supabase DB");
    expect(result.error).toBeTruthy();
  });

  it("pingRedis reports down on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ETIMEDOUT")));

    const result = await pingRedis();

    expect(result.status).toBe("down");
  });

  it("pingAnthropic reports down when the status endpoint returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response),
    );

    const result = await pingAnthropic();

    expect(result.status).toBe("down");
  });
});

// ---------------------------------------------------------------------------
// Missing configuration is reported honestly
// ---------------------------------------------------------------------------

describe("missing configuration is surfaced, not hidden", () => {
  it("pingRedis reports degraded 'Not configured' when Upstash env is absent", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const result = await pingRedis();

    expect(result.status).toBe("degraded");
    expect(result.error).toBe("Not configured");
  });

  it("pingSupabase reports down when the Supabase URL is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const result = await pingSupabase();

    expect(result.status).toBe("down");
    expect(result.error).toBe("Service not configured");
  });
});

// ---------------------------------------------------------------------------
// Status-page indicator mapping
// ---------------------------------------------------------------------------

describe("provider status-page indicator maps to our status", () => {
  it("maps indicator 'minor' to degraded and 'none' to up", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okStatusJson("minor")));
    expect((await pingStripe()).status).toBe("degraded");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okStatusJson("none")));
    expect((await pingStripe()).status).toBe("up");
  });
});

// ---------------------------------------------------------------------------
// Aggregate deep sweep survives a single dependency being down
// ---------------------------------------------------------------------------

describe("getDeepHealthStatus", () => {
  it("returns a status for every dependency and never rejects when one is down", async () => {
    // Every fetch fails — the sweep must still resolve with six entries.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("all down")));

    const results = await getDeepHealthStatus();

    expect(results).toHaveLength(6);
    expect(results.every((r) => ["up", "down", "degraded"].includes(r.status))).toBe(true);
    expect(results.map((r) => r.name)).toEqual(
      expect.arrayContaining(["Supabase DB", "Stripe", "Resend", "PostHog", "Anthropic", "Redis"]),
    );
  });
});
