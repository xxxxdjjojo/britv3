import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/status/status-page-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getStatusPageData: vi.fn(),
}));

import type { StatusIncident } from "@/services/admin/status-incident-service";
import {
  type StatusPageData,
  getStatusPageData,
} from "@/services/status/status-page-service";

import StatusPage from "./page";

const mockGet = vi.mocked(getStatusPageData);

function data(overrides: Partial<StatusPageData> = {}): StatusPageData {
  return {
    overall: "operational",
    components: [
      { key: "core", label: "Website & database", state: "operational" },
      { key: "payments", label: "Payments", state: "operational" },
      { key: "email", label: "Email", state: "operational" },
      { key: "analytics", label: "Analytics", state: "operational" },
    ],
    uptime: { probeCount: 2880, okCount: 2875, availabilityPct: 99.83 },
    windowDays: 30,
    minProbes: 100,
    latestProbe: { ok: true, checkedAt: "2026-07-13T09:00:00Z", latencyMs: 120 },
    incidents: { active: [], scheduled: [], recentResolved: [] },
    generatedAt: "2026-07-13T09:01:00Z",
    ...overrides,
  };
}

function incident(overrides: Partial<StatusIncident> = {}): StatusIncident {
  return {
    id: "inc-1",
    title: "Sign-in slowness",
    severity: "major",
    status: "investigating",
    affectedComponents: ["core"],
    startedAt: "2026-07-13T08:00:00Z",
    resolvedAt: null,
    scheduledFor: null,
    scheduledUntil: null,
    isPublished: true,
    createdAt: "2026-07-13T08:00:00Z",
    updatedAt: "2026-07-13T08:00:00Z",
    ...overrides,
  };
}

describe("Status page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the overall banner and each component with its state", async () => {
    mockGet.mockResolvedValue(data());
    render(await StatusPage());

    expect(
      screen.getByRole("heading", { name: /all systems operational/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Website & database")).toBeInTheDocument();
    expect(screen.getAllByText("Operational").length).toBeGreaterThan(0);
  });

  it("renders the trailing uptime percentage once the gate clears", async () => {
    mockGet.mockResolvedValue(data());
    render(await StatusPage());
    expect(screen.getByText(/99\.83/)).toBeInTheDocument();
  });

  it("shows an honest gated state with live status when probes are too few", async () => {
    mockGet.mockResolvedValue(
      data({
        uptime: { probeCount: 12, okCount: 12, availabilityPct: null },
        latestProbe: { ok: true, checkedAt: "2026-07-13T09:00:00Z", latencyMs: 120 },
      }),
    );
    render(await StatusPage());
    expect(screen.getByText(/at least 100 probes exist \(currently 12\)/i)).toBeInTheDocument();
    expect(screen.getByText(/up as of the last probe/i)).toBeInTheDocument();
  });

  it("reflects degraded and outage overall states", async () => {
    mockGet.mockResolvedValue(
      data({
        overall: "outage",
        components: [{ key: "core", label: "Website & database", state: "down" }],
      }),
    );
    render(await StatusPage());
    expect(screen.getByRole("heading", { name: /experiencing an outage/i })).toBeInTheDocument();
    expect(screen.getByText("Down")).toBeInTheDocument();
  });

  it("renders published incidents when present", async () => {
    mockGet.mockResolvedValue(
      data({ incidents: { active: [incident()], scheduled: [], recentResolved: [] } }),
    );
    render(await StatusPage());
    expect(screen.getByRole("heading", { name: /incidents & maintenance/i })).toBeInTheDocument();
    expect(screen.getByText("Sign-in slowness")).toBeInTheDocument();
  });

  it("omits the incidents section entirely when there are none", async () => {
    mockGet.mockResolvedValue(data());
    render(await StatusPage());
    expect(screen.queryByRole("heading", { name: /incidents & maintenance/i })).toBeNull();
  });

  it("NEVER leaks an internal error string, hostname, or env var name into the DOM", async () => {
    // Even if upstream health carried an error, the page must render only the
    // public shape. This guards the template itself against future regressions.
    mockGet.mockResolvedValue(data());
    const { container } = render(await StatusPage());
    const html = container.innerHTML;

    for (const forbidden of [
      "error",
      "ENOTFOUND",
      "supabase.co",
      "SUPABASE",
      "NEXT_PUBLIC",
      "latencyMs",
      "service_role",
      "apikey",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });
});
