import { describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { captureException, getErrorMessage } from "./capture-exception";

vi.mock("@sentry/nextjs", () => ({
  withScope: vi.fn((callback: (scope: {
    setTag: (key: string, value: string) => void;
    setExtras: (extra: Record<string, unknown>) => void;
  }) => void) => {
    callback({
      setTag: vi.fn(),
      setExtras: vi.fn(),
    });
  }),
  captureException: vi.fn(),
}));

describe("captureException", () => {
  it("normalizes unknown thrown values before sending them to Sentry", () => {
    captureException("boom", {
      module: "kernel",
      operation: "test",
      correlationId: "test-correlation",
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(getErrorMessage("boom")).toBe("boom");
  });
});
