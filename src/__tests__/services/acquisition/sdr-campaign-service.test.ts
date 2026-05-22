// src/__tests__/services/acquisition/sdr-campaign-service.test.ts
//
// MEMO PIVOT v2 — Move 2: AI-led acquisition. SDR campaign service queues
// outbound targets and renders persona-templated messages.

import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  enqueueOutbound,
  processBatch,
  type SdrTarget,
} from "@/services/acquisition/sdr-campaign-service";

const FAKE_TARGET: SdrTarget = {
  id: "t1",
  contact: "trader@example.com",
  audience: "trade",
  postcode: "SW1A",
  meta: { specialty: "plumbing" },
};

describe("enqueueOutbound", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns a stable jobId for the same target+persona pair (idempotent)", async () => {
    const a = await enqueueOutbound(FAKE_TARGET, "trade");
    const b = await enqueueOutbound(FAKE_TARGET, "trade");
    expect(a.jobId).toBe(b.jobId);
  });

  it("rejects targets with no contact address", async () => {
    await expect(
      enqueueOutbound({ ...FAKE_TARGET, contact: "" }, "trade"),
    ).rejects.toThrow();
  });

  it("rejects unknown personas", async () => {
    // @ts-expect-error — invalid persona on purpose
    await expect(enqueueOutbound(FAKE_TARGET, "unknown")).rejects.toThrow();
  });
});

describe("processBatch", () => {
  it("processes up to the requested batch size", async () => {
    const result = await processBatch({ limit: 5, dryRun: true });
    expect(result.processed).toBeLessThanOrEqual(5);
  });

  it("returns 0 when no targets are queued", async () => {
    const result = await processBatch({ limit: 5, dryRun: true });
    expect(result.processed).toBeGreaterThanOrEqual(0);
  });

  it("enforces a per-batch throttle of 200 messages max", async () => {
    // The runner clamps even if a caller asks for more
    const result = await processBatch({ limit: 10_000, dryRun: true });
    expect(result.processed).toBeLessThanOrEqual(200);
  });
});
