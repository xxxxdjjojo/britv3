import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/services/metrics/platform-metrics-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  computeDailyMetrics: vi.fn(),
  upsertDailyMetrics: vi.fn(),
}));

import {
  computeDailyMetrics,
  upsertDailyMetrics,
  utcDay,
} from "@/services/metrics/platform-metrics-service";

import { platformMetricsDaily } from "./platform-metrics-daily";

const mockCompute = vi.mocked(computeDailyMetrics);
const mockUpsert = vi.mocked(upsertDailyMetrics);

/** Minimal step harness: runs step.run callbacks immediately. */
function makeStep() {
  return {
    run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
  };
}

// Inngest's created function exposes its handler as `fn` (same access pattern
// as truedeed-report-snapshots.test.ts).
type Handler = (ctx: { event: unknown; step: unknown }) => Promise<unknown>;
const handler = (platformMetricsDaily as unknown as { fn: Handler }).fn;

describe("platformMetricsDaily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes then upserts the snapshot for the current UTC day", async () => {
    const rows = [{ metric: "registered_users" as const, value: 250 }];
    mockCompute.mockResolvedValue(rows);
    mockUpsert.mockResolvedValue(undefined);

    const result = await handler({ event: { name: "cron" }, step: makeStep() });

    expect(mockCompute).toHaveBeenCalledOnce();
    expect(mockUpsert).toHaveBeenCalledWith(expect.anything(), utcDay(), rows);
    expect(result).toEqual({
      status: "completed",
      day: utcDay(),
      metrics: ["registered_users"],
    });
  });

  it("propagates upsert failures so Inngest retries", async () => {
    mockCompute.mockResolvedValue([{ metric: "registered_users" as const, value: 1 }]);
    mockUpsert.mockRejectedValue(new Error("upsert failed"));

    await expect(handler({ event: {}, step: makeStep() })).rejects.toThrow(/upsert failed/);
  });
});
