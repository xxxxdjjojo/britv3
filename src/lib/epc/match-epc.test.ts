/**
 * Unit tests for EPC ↔ property matching.
 *
 * UPRN is the reliable join; postcode + PAON is the fallback. We deliberately
 * UNDER-link (return null) rather than mis-link a certificate to the wrong
 * property — a wrong EPC band is worse than a missing one.
 */
import { describe, it, expect } from "vitest";
import { matchEpc, pickBestEpc } from "./match-epc";

describe("matchEpc", () => {
  it("matches on exact UPRN with full confidence", () => {
    const r = matchEpc(
      { uprn: "68132136", postcode: "SM7 3NE", paon: "1" },
      { uprn: "68132136", postcode: "ZZ9 9ZZ", paon: "999" },
    );
    expect(r).toEqual({ matched: true, confidence: 1 });
  });

  it("matches on postcode + PAON when UPRN is absent", () => {
    const r = matchEpc(
      { uprn: null, postcode: "sm7 3ne", paon: "1" },
      { uprn: null, postcode: "SM7 3NE", paon: "1" },
    );
    expect(r.matched).toBe(true);
    expect(r.confidence).toBeCloseTo(0.9);
  });

  it("does not match when the postcode agrees but the PAON differs", () => {
    const r = matchEpc(
      { uprn: null, postcode: "SM7 3NE", paon: "1" },
      { uprn: null, postcode: "SM7 3NE", paon: "2" },
    );
    expect(r.matched).toBe(false);
  });

  it("does not match across different postcodes", () => {
    const r = matchEpc(
      { uprn: null, postcode: "SM7 3NE", paon: "1" },
      { uprn: null, postcode: "EC1A 1BB", paon: "1" },
    );
    expect(r.matched).toBe(false);
  });
});

describe("pickBestEpc", () => {
  const property = { uprn: "68132136", postcode: "SM7 3NE", paon: "1" };

  it("prefers a UPRN match over a postcode+PAON match", () => {
    const best = pickBestEpc(property, [
      {
        certificateNumber: "PCODE",
        uprn: null,
        postcode: "SM7 3NE",
        paon: "1",
        inspectionDate: "2025-01-01",
      },
      {
        certificateNumber: "UPRN",
        uprn: "68132136",
        postcode: "ZZ9 9ZZ",
        paon: "9",
        inspectionDate: "2018-01-01",
      },
    ]);
    expect(best?.certificateNumber).toBe("UPRN");
    expect(best?.confidence).toBe(1);
  });

  it("breaks ties by latest inspection date", () => {
    const best = pickBestEpc(
      { uprn: null, postcode: "SM7 3NE", paon: "1" },
      [
        {
          certificateNumber: "OLD",
          uprn: null,
          postcode: "SM7 3NE",
          paon: "1",
          inspectionDate: "2012-06-01",
        },
        {
          certificateNumber: "NEW",
          uprn: null,
          postcode: "SM7 3NE",
          paon: "1",
          inspectionDate: "2024-06-01",
        },
      ],
    );
    expect(best?.certificateNumber).toBe("NEW");
  });

  it("returns null when nothing matches (under-link, never mis-link)", () => {
    const best = pickBestEpc(
      { uprn: "111", postcode: "SM7 3NE", paon: "1" },
      [
        {
          certificateNumber: "X",
          uprn: "222",
          postcode: "EC1A 1BB",
          paon: "9",
          inspectionDate: "2024-01-01",
        },
      ],
    );
    expect(best).toBeNull();
  });
});
