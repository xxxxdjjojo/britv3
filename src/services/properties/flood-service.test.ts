import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFloodRisk, mapRiskBand } from "./flood-service";

describe("mapRiskBand", () => {
  it("maps each EA raw band to its clean band", () => {
    expect(mapRiskBand("High")).toBe("High");
    expect(mapRiskBand("Medium")).toBe("Medium");
    expect(mapRiskBand("Low")).toBe("Low");
    expect(mapRiskBand("Very low")).toBe("Very Low");
  });

  it("treats absent band (unmapped land) as Very Low", () => {
    expect(mapRiskBand(null)).toBe("Very Low");
    expect(mapRiskBand(undefined)).toBe("Very Low");
  });

  it("returns null for an unexpected band string", () => {
    expect(mapRiskBand("Catastrophic")).toBeNull();
    expect(mapRiskBand("very low")).toBeNull();
    expect(mapRiskBand("")).toBeNull();
  });
});

describe("getFloodRisk", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(responses: Array<{ ok: boolean; json: unknown }>) {
    const fetchMock = vi.fn();
    for (const r of responses) {
      fetchMock.mockResolvedValueOnce({
        ok: r.ok,
        json: async () => r.json,
      });
    }
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  function featureCollection(riskBand: string) {
    return {
      type: "FeatureCollection",
      features: [{ properties: { risk_band: riskBand } }],
    };
  }

  it("returns High for a high-risk feature", async () => {
    stubFetch([{ ok: true, json: featureCollection("High") }]);
    expect(await getFloodRisk(53.957, -1.083)).toEqual({ riskLevel: "High" });
  });

  it("title-cases 'Very low' to 'Very Low'", async () => {
    stubFetch([{ ok: true, json: featureCollection("Very low") }]);
    expect(await getFloodRisk(51.501, -0.118)).toEqual({
      riskLevel: "Very Low",
    });
  });

  it("treats an empty feature list as Very Low (unmapped land)", async () => {
    stubFetch([
      { ok: true, json: { type: "FeatureCollection", features: [] } },
    ]);
    expect(await getFloodRisk(51.501, -0.118)).toEqual({
      riskLevel: "Very Low",
    });
  });

  it("returns null on a non-ok response", async () => {
    stubFetch([{ ok: false, json: null }]);
    expect(await getFloodRisk(53.957, -1.083)).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getFloodRisk(53.957, -1.083)).toBeNull();
  });

  it("returns null for an unexpected band string", async () => {
    stubFetch([{ ok: true, json: featureCollection("Catastrophic") }]);
    expect(await getFloodRisk(53.957, -1.083)).toBeNull();
  });

  it("returns null when the response shape is invalid", async () => {
    stubFetch([{ ok: true, json: { not: "geojson" } }]);
    expect(await getFloodRisk(53.957, -1.083)).toBeNull();
  });
});
