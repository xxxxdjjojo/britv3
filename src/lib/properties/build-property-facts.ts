/**
 * Builds the categorized "Facts & features" data for the property detail page.
 *
 * Pure, server-safe. Only fields that have a real value are emitted, and a
 * category is omitted entirely when it has no facts — so the UI can render
 * with graceful absence (no blank cards, no "—" placeholders).
 */

import type { PropertyDetail } from "@/services/properties/property-detail-service";

export type Fact = Readonly<{ label: string; value: string }>;
export type FactGroup = Readonly<{ title: string; facts: Fact[] }>;

type Property = PropertyDetail["property"];
type Listing = PropertyDetail["listing"];

const PLANNING_LABELS: Readonly<Record<string, string>> = {
  granted: "Permission granted",
  pending: "Decision pending",
  refused: "Refused",
  none_known: "None known",
};

function titleCase(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMoney(n: number): string {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pushGroup(groups: FactGroup[], title: string, facts: Fact[]): void {
  if (facts.length > 0) groups.push({ title, facts });
}

export function buildPropertyFacts(
  property: Property,
  listing: Listing,
): FactGroup[] {
  const groups: FactGroup[] = [];

  // --- Key facts -----------------------------------------------------------
  const key: Fact[] = [];
  if (property.propertyType) {
    key.push({ label: "Type", value: titleCase(property.propertyType) });
  }
  key.push({
    label: "Bedrooms",
    value: property.bedrooms === 0 ? "Studio" : String(property.bedrooms),
  });
  key.push({ label: "Bathrooms", value: String(property.bathrooms) });
  if (property.receptionRooms != null) {
    key.push({ label: "Receptions", value: String(property.receptionRooms) });
  }
  if (property.squareFootage != null && property.squareFootage > 0) {
    key.push({
      label: "Size",
      value: `${property.squareFootage.toLocaleString("en-GB")} sq ft`,
    });
  }
  if (property.yearBuilt != null) {
    key.push({ label: "Year built", value: String(property.yearBuilt) });
  }
  if (property.newBuild) {
    key.push({ label: "New build", value: "Yes" });
  }
  pushGroup(groups, "Key facts", key);

  // --- Tenure & running costs ---------------------------------------------
  const tenure: Fact[] = [];
  if (property.tenure) {
    tenure.push({ label: "Tenure", value: titleCase(property.tenure) });
  }
  if (property.tenure === "leasehold" && property.leaseRemainingYears != null) {
    tenure.push({
      label: "Lease remaining",
      value: `${property.leaseRemainingYears} years`,
    });
  }
  if (listing.groundRentAnnual != null && listing.groundRentAnnual > 0) {
    tenure.push({
      label: "Ground rent",
      value: `${formatMoney(listing.groundRentAnnual)} / year`,
    });
  }
  if (listing.serviceChargeAnnual != null && listing.serviceChargeAnnual > 0) {
    tenure.push({
      label: "Service charge",
      value: `${formatMoney(listing.serviceChargeAnnual)} / year`,
    });
  }
  if (property.councilTaxBand) {
    tenure.push({ label: "Council tax", value: `Band ${property.councilTaxBand}` });
  }
  pushGroup(groups, "Tenure & running costs", tenure);

  // --- Energy & planning ---------------------------------------------------
  const energy: Fact[] = [];
  if (property.epcRating) {
    energy.push({ label: "EPC rating", value: property.epcRating });
  }
  if (property.epcScore != null) {
    energy.push({ label: "EPC score", value: `${property.epcScore}/100` });
  }
  if (
    property.planningPermissionStatus &&
    PLANNING_LABELS[property.planningPermissionStatus]
  ) {
    energy.push({
      label: "Planning",
      value: PLANNING_LABELS[property.planningPermissionStatus],
    });
  }
  pushGroup(groups, "Energy & planning", energy);

  // --- Availability --------------------------------------------------------
  const avail: Fact[] = [];
  if (listing.listedDate) {
    avail.push({ label: "Listed", value: formatDate(listing.listedDate) });
  }
  if (listing.availableFrom) {
    avail.push({ label: "Available from", value: formatDate(listing.availableFrom) });
  }
  if (property.isHmo) {
    avail.push({ label: "HMO", value: "Licensed HMO" });
  }
  pushGroup(groups, "Availability", avail);

  return groups;
}
