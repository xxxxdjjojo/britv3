import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { limitMock } = vi.hoisted(() => ({
  limitMock: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/services/admin/health-service", () => ({
  pingSupabase: vi.fn(),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: limitMock }),
}));

import { pingSupabase } from "@/services/admin/health-service";

import { GET } from "./route";

const mockPing = vi.mocked(pingSupabase);

function healthRequest(ip = "203.0.113.7"): NextRequest {
  return new NextRequest("http://localhost/api/health", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limitMock.mockResolvedValue({ success: true });
  });

  it("returns 200 with ok=true when the database answers", async () => {
    mockPing.mockResolvedValue({ name: "Supabase DB", status: "up", latencyMs: 42 });

    const res = await GET(healthRequest());
    const body = (await res.json()) as { ok: boolean; latencyMs: number; ts: string };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.latencyMs).toBe(42);
    expect(typeof body.ts).toBe("string");
  });

  it("returns 503 with ok=false when the database is down", async () => {
    mockPing.mockResolvedValue({
      name: "Supabase DB",
      status: "down",
      latencyMs: null,
      error: "Unreachable",
    });

    const res = await GET(healthRequest());
    const body = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
  });

  it("treats degraded as not ok (503)", async () => {
    mockPing.mockResolvedValue({ name: "Supabase DB", status: "degraded", latencyMs: 900 });

    const res = await GET(healthRequest());
    expect(res.status).toBe(503);
  });

  it("returns 429 and never pings the database when the per-IP limit is hit", async () => {
    limitMock.mockResolvedValue({ success: false });

    const res = await GET(healthRequest("198.51.100.9"));
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(429);
    expect(body.error).toBe("rate_limited");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(limitMock).toHaveBeenCalledWith("health:198.51.100.9");
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("is never cached", async () => {
    mockPing.mockResolvedValue({ name: "Supabase DB", status: "up", latencyMs: 10 });

    const res = await GET(healthRequest());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
