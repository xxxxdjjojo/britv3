import { describe, expect, test } from "vitest";
import {
  computeConversionMetrics,
  formatPercent,
  rankDevelopmentPerformance,
  ratio,
} from "./metrics";
import type { DevelopmentLead, DevelopmentViewing } from "./types";

function lead(overrides: Partial<DevelopmentLead> = {}): DevelopmentLead {
  return {
    id: Math.random().toString(36),
    developmentId: "dev-1",
    unitId: null,
    leadType: "register_interest",
    status: "new",
    name: "Test Buyer",
    email: "buyer@example.com",
    phone: null,
    buyerStatus: null,
    budget: null,
    desiredMoveDate: null,
    mortgagePosition: null,
    hasPropertyToSell: null,
    preferredPlot: null,
    message: null,
    sourceRoute: null,
    utmSource: null,
    createdAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function viewing(status: string): DevelopmentViewing {
  return {
    id: Math.random().toString(36),
    developmentId: "dev-1",
    leadId: null,
    unitId: null,
    scheduledFor: null,
    status,
    notes: null,
    createdAt: "2026-06-01T00:00:00Z",
  };
}

describe("ratio", () => {
  test("returns 0 when denominator is 0", () => {
    expect(ratio(5, 0)).toBe(0);
  });

  test("rounds to 4 decimal places", () => {
    expect(ratio(1, 3)).toBe(0.3333);
  });
});

describe("formatPercent", () => {
  test("formats a ratio as a one-dp percentage", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("computeConversionMetrics", () => {
  test("computes the headline enquiry-to-reservation conversion", () => {
    // Arrange: 10 enquiries, 2 reserved.
    const leads = [
      ...Array.from({ length: 8 }, () => lead({ status: "new" })),
      lead({ status: "reserved" }),
      lead({ status: "reserved" }),
    ];

    // Act
    const metrics = computeConversionMetrics(leads, []);

    // Assert
    expect(metrics.totalEnquiries).toBe(10);
    expect(metrics.reservationRequests).toBe(2);
    expect(metrics.enquiryToReservation).toBe(0.2);
  });

  test("counts qualified statuses correctly", () => {
    const leads = [
      lead({ status: "new" }),
      lead({ status: "qualified" }),
      lead({ status: "contacted" }),
      lead({ status: "viewing_booked" }),
      lead({ status: "reserved" }),
      lead({ status: "lost" }),
      lead({ status: "closed" }),
    ];
    const metrics = computeConversionMetrics(leads, []);
    // qualified, contacted, viewing_booked, reserved → 4
    expect(metrics.qualifiedEnquiries).toBe(4);
  });

  test("only counts confirmed/completed viewings as bookings", () => {
    const metrics = computeConversionMetrics(
      [lead(), lead()],
      [viewing("requested"), viewing("confirmed"), viewing("completed")],
    );
    expect(metrics.viewingBookings).toBe(2);
    expect(metrics.enquiryToViewing).toBe(1); // 2 bookings / 2 enquiries
  });

  test("counts brochure downloads from lead type", () => {
    const metrics = computeConversionMetrics(
      [lead({ leadType: "request_brochure" }), lead({ leadType: "register_interest" })],
      [],
    );
    expect(metrics.brochureDownloads).toBe(1);
  });

  test("picks the most common lead source", () => {
    const metrics = computeConversionMetrics(
      [
        lead({ utmSource: "google" }),
        lead({ utmSource: "google" }),
        lead({ utmSource: "facebook" }),
        lead({ utmSource: null, sourceRoute: "/new-homes" }),
      ],
      [],
    );
    expect(metrics.topLeadSource).toBe("google");
  });

  test("cost per qualified enquiry is null without spend, computed with spend", () => {
    const leads = [lead({ status: "qualified" }), lead({ status: "qualified" })];
    expect(computeConversionMetrics(leads, []).costPerQualifiedEnquiry).toBeNull();
    expect(
      computeConversionMetrics(leads, [], { spend: 500 }).costPerQualifiedEnquiry,
    ).toBe(250);
  });

  test("handles an empty dataset without dividing by zero", () => {
    const metrics = computeConversionMetrics([], []);
    expect(metrics.enquiryToReservation).toBe(0);
    expect(metrics.viewingToReservation).toBe(0);
    expect(metrics.topLeadSource).toBeNull();
  });
});

describe("rankDevelopmentPerformance", () => {
  test("scopes lead counts to each development and ranks by volume", () => {
    const developments = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
    ];
    const leads = [
      lead({ developmentId: "a", status: "reserved" }),
      lead({ developmentId: "a", status: "new" }),
      lead({ developmentId: "a", status: "new" }),
      lead({ developmentId: "b", status: "reserved" }),
    ];

    const ranked = rankDevelopmentPerformance(developments, leads);

    expect(ranked[0].developmentId).toBe("a"); // more enquiries
    expect(ranked[0].enquiries).toBe(3);
    expect(ranked[0].reservations).toBe(1);
    expect(ranked[1].developmentId).toBe("b");
    expect(ranked[1].enquiries).toBe(1);
  });
});
