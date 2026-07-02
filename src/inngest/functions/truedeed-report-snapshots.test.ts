import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { truedeedReportSnapshots } from "./truedeed-report-snapshots";

const mockCreateAdminClient = vi.mocked(createAdminClient);

/** Minimal step harness: runs step.run callbacks immediately. */
function makeStep() {
  return {
    run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
  };
}

// Inngest's created function exposes its handler as `fn` (same access pattern
// as the other truedeed-* function tests).
type Handler = (ctx: { event: unknown; step: unknown }) => Promise<unknown>;
const handler = (truedeedReportSnapshots as unknown as { fn: Handler }).fn;

describe("truedeedReportSnapshots", () => {
  const rpc = vi.fn(async () => ({ error: null }));

  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ error: null });
    mockCreateAdminClient.mockReturnValue({ rpc } as never);
  });

  it("refreshes both snapshot RPCs with a null period on cron runs", async () => {
    const step = makeStep();
    const result = await handler({ event: { name: "cron" }, step });

    expect(rpc).toHaveBeenCalledWith("refresh_reality_gap_snapshots", {
      p_period: null,
    });
    expect(rpc).toHaveBeenCalledWith("refresh_time_to_sell_snapshots", {
      p_period: null,
    });
    expect(result).toEqual({ status: "completed", period: null });
  });

  it("passes event.data.period through on manual refreshes", async () => {
    const step = makeStep();
    await handler({
      event: {
        name: "truedeed/report-snapshots.refresh-requested",
        data: { period: "2026-Q1" },
      },
      step,
    });

    expect(rpc).toHaveBeenCalledWith("refresh_reality_gap_snapshots", {
      p_period: "2026-Q1",
    });
    expect(rpc).toHaveBeenCalledWith("refresh_time_to_sell_snapshots", {
      p_period: "2026-Q1",
    });
  });

  it("throws (so Inngest retries) when an RPC fails", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "boom" } } as never);
    const step = makeStep();

    await expect(handler({ event: {}, step })).rejects.toThrow(
      /refresh_reality_gap_snapshots failed/,
    );
  });
});
