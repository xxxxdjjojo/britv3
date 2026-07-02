import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/admin/health-service", () => ({
  pingSupabase: vi.fn(),
}));

import { pingSupabase } from "@/services/admin/health-service";

import { GET } from "./route";

const mockPing = vi.mocked(pingSupabase);

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with ok=true when the database answers", async () => {
    mockPing.mockResolvedValue({ name: "Supabase DB", status: "up", latencyMs: 42 });

    const res = await GET();
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

    const res = await GET();
    const body = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
  });

  it("treats degraded as not ok (503)", async () => {
    mockPing.mockResolvedValue({ name: "Supabase DB", status: "degraded", latencyMs: 900 });

    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("is never cached", async () => {
    mockPing.mockResolvedValue({ name: "Supabase DB", status: "up", latencyMs: 10 });

    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
