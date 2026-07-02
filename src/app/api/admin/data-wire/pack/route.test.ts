import { beforeEach, describe, expect, it, vi } from "vitest";

const { auditedMock, getWireAreasMock } = vi.hoisted(() => ({
  auditedMock: vi.fn(),
  getWireAreasMock: vi.fn(),
}));

vi.mock("@/lib/audited-admin-action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/audited-admin-action")>();
  return {
    AdminActionError: actual.AdminActionError,
    auditedAdminActionWithPermission: auditedMock,
  };
});

vi.mock("@/services/data-wire/data-wire-service", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/data-wire/data-wire-service")
  >();
  return { ...actual, getWireAreas: getWireAreasMock };
});

import { AdminActionError } from "@/lib/audited-admin-action";

const VISIBLE_AREA = {
  areaId: "ealing",
  areaName: "Ealing",
  period: "2026-Q2",
  gapPct: 3.4,
  medianAskingPounds: 300000,
  medianSoldPounds: 290000,
  sampleAskingN: 40,
  sampleSoldN: 400,
  rank: 1,
  totalRanked: 2,
};

function packRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/data-wire/pack", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/data-wire/pack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mirror the real wrapper: run fn, surface AdminActionError statuses.
    auditedMock.mockImplementation(
      async (
        _req: Request,
        _action: string,
        _targetType: string,
        _targetId: string,
        _permission: string,
        fn: () => Promise<unknown>,
      ) => {
        try {
          return Response.json(await fn());
        } catch (e) {
          if (e instanceof AdminActionError) {
            return Response.json({ error: e.message }, { status: e.status });
          }
          return Response.json({ error: "Action failed" }, { status: 500 });
        }
      },
    );
    getWireAreasMock.mockResolvedValue({
      period: "2026-Q2",
      availablePeriods: ["2026-Q2"],
      areas: [VISIBLE_AREA],
    });
  });

  it("wires the audited action with the send_campaigns permission", async () => {
    const { POST } = await import("./route");
    await POST(packRequest({ areaId: "ealing", period: "2026-Q2" }));

    expect(auditedMock).toHaveBeenCalledTimes(1);
    const [, action, targetType, targetId, permission] =
      auditedMock.mock.calls[0];
    expect(action).toBe("data_wire.pack_generated");
    expect(targetType).toBe("data_wire");
    expect(targetId).toBe("ealing");
    expect(permission).toBe("send_campaigns");
  });

  it("returns the pack as an HTML attachment", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      packRequest({ areaId: "ealing", period: "2026-Q2" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="truedeed-data-wire-ealing-2026-Q2.html"',
    );
    const html = await response.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Ealing");
    expect(html).toContain("Data: TrueDeed (truedeed.co.uk/reports/reality-gap)");
    // Absolute OG chart URLs.
    expect(html).toContain("/api/og/league?");
    expect(html).toContain("/api/og/report?");
  });

  it("rejects a suppressed/unknown district with 404 (never generates the pack)", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      packRequest({ areaId: "suppressed-district", period: "2026-Q2" }),
    );

    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("No publishable");
  });

  it("400s on an invalid body without invoking the audit wrapper", async () => {
    const { POST } = await import("./route");
    const response = await POST(packRequest({ areaId: "", period: "june" }));

    expect(response.status).toBe(400);
    expect(auditedMock).not.toHaveBeenCalled();
  });
});
