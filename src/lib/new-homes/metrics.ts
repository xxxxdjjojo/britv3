// Pure conversion-metric calculations for the developer dashboard.
//
// These functions are intentionally side-effect free and take plain data so
// they can be unit-tested in isolation. The headline number is
// enquiry_to_reservation_conversion = reservations / enquiries.

import type {
  DevelopmentLead,
  DevelopmentLeadStatus,
  DevelopmentViewing,
} from "./types";

/** Lead statuses that count as a "qualified" enquiry (engaged, not dead). */
export const QUALIFIED_STATUSES: ReadonlySet<DevelopmentLeadStatus> = new Set([
  "qualified",
  "contacted",
  "viewing_booked",
  "reserved",
]);

/** A reservation has been requested/confirmed once the lead reaches 'reserved'. */
const RESERVED_STATUS: DevelopmentLeadStatus = "reserved";

export interface ConversionMetrics {
  totalEnquiries: number;
  qualifiedEnquiries: number;
  brochureDownloads: number;
  viewingBookings: number;
  reservationRequests: number;
  /** reservations / enquiries — the headline commercial metric. */
  enquiryToReservation: number;
  /** viewings / enquiries */
  enquiryToViewing: number;
  /** reservations / viewings */
  viewingToReservation: number;
  /** Most common attribution source across all leads, or null if none. */
  topLeadSource: string | null;
  /**
   * Cost per qualified enquiry. Null until ad-spend is wired in — the dashboard
   * renders a "—" placeholder. Pass `spend` to compute.
   */
  costPerQualifiedEnquiry: number | null;
}

/** Safe ratio rounded to 4 dp; returns 0 when the denominator is 0. */
export function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

/** Format a 0..1 ratio as a percentage string, e.g. 0.1234 → "12.3%". */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function topSource(leads: ReadonlyArray<DevelopmentLead>): string | null {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const source = lead.utmSource ?? lead.sourceRoute ?? null;
    if (!source) continue;
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [source, count] of counts) {
    if (count > bestCount) {
      best = source;
      bestCount = count;
    }
  }
  return best;
}

export function computeConversionMetrics(
  leads: ReadonlyArray<DevelopmentLead>,
  viewings: ReadonlyArray<DevelopmentViewing>,
  options: { spend?: number | null } = {},
): ConversionMetrics {
  const totalEnquiries = leads.length;
  const qualifiedEnquiries = leads.filter((l) =>
    QUALIFIED_STATUSES.has(l.status),
  ).length;
  const brochureDownloads = leads.filter(
    (l) => l.leadType === "request_brochure",
  ).length;
  // A viewing "booking" is a viewing record that is confirmed or completed.
  const viewingBookings = viewings.filter(
    (v) => v.status === "confirmed" || v.status === "completed",
  ).length;
  const reservationRequests = leads.filter(
    (l) => l.status === RESERVED_STATUS,
  ).length;

  const spend = options.spend ?? null;
  const costPerQualifiedEnquiry =
    spend !== null && qualifiedEnquiries > 0
      ? Math.round((spend / qualifiedEnquiries) * 100) / 100
      : null;

  return {
    totalEnquiries,
    qualifiedEnquiries,
    brochureDownloads,
    viewingBookings,
    reservationRequests,
    enquiryToReservation: ratio(reservationRequests, totalEnquiries),
    enquiryToViewing: ratio(viewingBookings, totalEnquiries),
    viewingToReservation: ratio(reservationRequests, viewingBookings),
    topLeadSource: topSource(leads),
    costPerQualifiedEnquiry,
  };
}

export interface DevelopmentPerformance {
  developmentId: string;
  name: string;
  enquiries: number;
  reservations: number;
  enquiryToReservation: number;
}

/** Rank developments by enquiry volume then conversion (best first). */
export function rankDevelopmentPerformance(
  developments: ReadonlyArray<{ id: string; name: string }>,
  leads: ReadonlyArray<DevelopmentLead>,
): DevelopmentPerformance[] {
  return developments
    .map((dev) => {
      const devLeads = leads.filter((l) => l.developmentId === dev.id);
      const reservations = devLeads.filter(
        (l) => l.status === RESERVED_STATUS,
      ).length;
      return {
        developmentId: dev.id,
        name: dev.name,
        enquiries: devLeads.length,
        reservations,
        enquiryToReservation: ratio(reservations, devLeads.length),
      };
    })
    .sort(
      (a, b) =>
        b.enquiries - a.enquiries ||
        b.enquiryToReservation - a.enquiryToReservation,
    );
}
