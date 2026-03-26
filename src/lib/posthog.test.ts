import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInit = vi.fn();
vi.mock("posthog-js", () => ({
  default: { init: (...args: unknown[]) => mockInit(...args) },
}));

describe("initPostHog", () => {
  beforeEach(() => {
    vi.resetModules();
    mockInit.mockClear();
    vi.stubGlobal("window", {});
  });

  it("does not call posthog.init when NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { initPostHog } = await import("./posthog");
    initPostHog();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("passes disable_surveys: true to reduce unnecessary fetches", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    const { initPostHog } = await import("./posthog");
    initPostHog();
    expect(mockInit).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ disable_surveys: true })
    );
  });
});
