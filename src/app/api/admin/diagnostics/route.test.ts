import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-guard", () => ({ adminWithPermission: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => ({})) }));
vi.mock("@/services/admin/diagnostics-service", () => ({ getDiagnostics: vi.fn() }));
vi.mock("@/services/admin/health-service", () => ({ getDeepHealthStatus: vi.fn() }));

import { adminWithPermission } from "@/lib/admin-guard";
import { getDeepHealthStatus } from "@/services/admin/health-service";
import { getDiagnostics } from "@/services/admin/diagnostics-service";

import { GET } from "./route";

const mockGuard = vi.mocked(adminWithPermission);
const mockDiagnostics = vi.mocked(getDiagnostics);
const mockDeep = vi.mocked(getDeepHealthStatus);

describe("GET /api/admin/diagnostics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the guard's Response when permission is denied", async () => {
    mockGuard.mockResolvedValue(
      Response.json({ error: "Forbidden" }, { status: 403 }) as never,
    );
    const res = await GET(new Request("http://localhost/api/admin/diagnostics"));
    expect(res.status).toBe(403);
    expect(mockDiagnostics).not.toHaveBeenCalled();
  });

  it("returns diagnostics + services when permitted", async () => {
    mockGuard.mockResolvedValue({
      user: { id: "admin-1" },
      supabase: {},
      role: "dev_admin",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    mockDiagnostics.mockResolvedValue([
      { key: "stripe_dlq_backlog", label: "Stripe webhook DLQ", level: "ok", value: 0, detail: "0 failed." },
    ]);
    mockDeep.mockResolvedValue([
      { name: "Supabase DB", status: "up", latencyMs: 20, error: "internal boom hostname.supabase.co" },
    ]);

    const res = await GET(new Request("http://localhost/api/admin/diagnostics"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { diagnostics: unknown[]; services: unknown[] };
    expect(body.diagnostics).toHaveLength(1);

    // The internal error string must be stripped from the response.
    const text = JSON.stringify(body);
    expect(text).not.toContain("boom");
    expect(text).not.toContain("supabase.co");
    expect(text).not.toContain("error");
  });
});
