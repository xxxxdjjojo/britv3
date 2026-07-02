import { describe, it, expect, vi, beforeEach } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: trackEventMock,
}));

import {
  trackToolStarted,
  trackToolCompleted,
  trackToolShared,
  trackReportViewed,
  trackBriefingSubscribed,
  trackPledgeViewed,
} from "@/lib/analytics/influence-events";

describe("influence-events", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it("trackToolStarted emits tool_started with the tool key", () => {
    trackToolStarted("rent-rights-checker");

    expect(trackEventMock).toHaveBeenCalledWith("tool_started", {
      tool: "rent-rights-checker",
    });
  });

  it("trackToolCompleted emits tool_completed with the tool key and extra properties", () => {
    trackToolCompleted("rent-rights-checker", { outcome: "eligible" });

    expect(trackEventMock).toHaveBeenCalledWith("tool_completed", {
      tool: "rent-rights-checker",
      outcome: "eligible",
    });
  });

  it("trackToolCompleted works without extra properties", () => {
    trackToolCompleted("rent-rights-checker");

    expect(trackEventMock).toHaveBeenCalledWith("tool_completed", {
      tool: "rent-rights-checker",
    });
  });

  it("trackToolShared emits tool_shared with tool and channel", () => {
    trackToolShared("rent-rights-checker", "whatsapp");

    expect(trackEventMock).toHaveBeenCalledWith("tool_shared", {
      tool: "rent-rights-checker",
      channel: "whatsapp",
    });
  });

  it("trackReportViewed emits report_viewed with the report key", () => {
    trackReportViewed("renting-index-2026");

    expect(trackEventMock).toHaveBeenCalledWith("report_viewed", {
      report: "renting-index-2026",
    });
  });

  it("trackBriefingSubscribed emits briefing_subscribed with the audience", () => {
    trackBriefingSubscribed("renters");

    expect(trackEventMock).toHaveBeenCalledWith("briefing_subscribed", {
      audience: "renters",
    });
  });

  it("trackPledgeViewed emits pledge_viewed with the pledge key", () => {
    trackPledgeViewed("no-fake-listings");

    expect(trackEventMock).toHaveBeenCalledWith("pledge_viewed", {
      pledge: "no-fake-listings",
    });
  });
});
