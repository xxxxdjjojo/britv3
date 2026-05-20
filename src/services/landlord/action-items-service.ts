/**
 * Action items scoring service — pure TypeScript, no DB dependency.
 * Scores and ranks landlord action items by priority.
 *
 * SCORING PIPELINE:
 *   Raw data (arrears, compliance, tenancies, maintenance)
 *       │
 *       ▼
 *   Score each item (weight × urgency factor)
 *       │
 *       ▼
 *   Sort by score DESC
 *       │
 *       ▼
 *   Return top 5 with action metadata
 *
 * PRIORITY WEIGHTS:
 *   Emergency maintenance = 100 (safety risk)
 *   Expired compliance    =  90 (prosecution risk)
 *   Rent >14 days overdue =  80 (cashflow risk)
 *   Compliance <14 days   =  70 (imminent prosecution)
 *   Rent 7-14 days due    =  60 (arrears escalating)
 *   Tenancy <30 days end  =  50 (void risk)
 *   Rent 1-7 days due     =  40 (early chase)
 *   Compliance <30 days   =  30 (plan ahead)
 *   Tenancy 30-60 days    =  20 (plan renewal)
 *   Routine maintenance   =  10 (non-urgent)
 */

export type ActionItemType = "arrears" | "compliance" | "tenancy" | "maintenance";

export type OverdueRentInput = Readonly<{
  tenantName: string;
  propertyAddress: string;
  amount: number;
  daysDue: number;
  propertyId: string;
}>;

export type ExpiringComplianceInput = Readonly<{
  category: string;
  propertyAddress: string;
  daysUntilExpiry: number;
  propertyId: string;
}>;

export type EndingTenancyInput = Readonly<{
  tenantName: string;
  propertyAddress: string;
  daysUntilEnd: number;
  propertyId: string;
  tenancyId: string;
  currentRent: number;
}>;

export type OpenMaintenanceInput = Readonly<{
  title: string;
  propertyAddress: string;
  priority: string;
  propertyId: string;
  requestId: string;
}>;

export type ActionItemInput = Readonly<{
  overdueRents: OverdueRentInput[];
  expiringCompliance: ExpiringComplianceInput[];
  endingTenancies: EndingTenancyInput[];
  openMaintenance: OpenMaintenanceInput[];
}>;

export type ScoredActionItem = Readonly<{
  type: ActionItemType;
  score: number;
  title: string;
  description: string;
  href: string;
  urgency: "critical" | "warning" | "info";
  daysDue?: number;
}>;

function scoreOverdueRent(item: OverdueRentInput): ScoredActionItem {
  const score = item.daysDue > 14 ? 80 : item.daysDue > 7 ? 60 : 40;
  const urgency = item.daysDue > 7 ? "critical" : "warning";
  return {
    type: "arrears",
    score,
    title: `${item.tenantName} — £${item.amount} overdue`,
    description: `${item.daysDue} days late at ${item.propertyAddress}`,
    href: `/dashboard/landlord/rent/${item.propertyId}`,
    urgency,
    daysDue: item.daysDue,
  };
}

function scoreCompliance(item: ExpiringComplianceInput): ScoredActionItem {
  const score = item.daysUntilExpiry <= 0 ? 90 : item.daysUntilExpiry <= 14 ? 70 : 30;
  const urgency = item.daysUntilExpiry <= 0 ? "critical" : item.daysUntilExpiry <= 14 ? "warning" : "info";
  const verb = item.daysUntilExpiry <= 0 ? "expired" : `expires in ${item.daysUntilExpiry}d`;
  return {
    type: "compliance",
    score,
    title: `${item.category} ${verb}`,
    description: item.propertyAddress,
    href: `/dashboard/landlord/compliance`,
    urgency,
  };
}

function scoreTenancy(item: EndingTenancyInput): ScoredActionItem {
  const score = item.daysUntilEnd <= 30 ? 50 : 20;
  return {
    type: "tenancy",
    score,
    title: `Tenancy ending in ${item.daysUntilEnd} days`,
    description: `${item.tenantName} at ${item.propertyAddress} — £${item.currentRent}/mo`,
    href: `/dashboard/landlord/properties/${item.propertyId}/tenancies/${item.tenancyId}`,
    urgency: item.daysUntilEnd <= 30 ? "warning" : "info",
  };
}

function scoreMaintenance(item: OpenMaintenanceInput): ScoredActionItem {
  const score = item.priority === "emergency" ? 100 : 10;
  return {
    type: "maintenance",
    score,
    title: item.title,
    description: item.propertyAddress,
    href: `/dashboard/landlord/maintenance/${item.requestId}`,
    urgency: item.priority === "emergency" ? "critical" : "info",
  };
}

export function scoreActionItems(input: ActionItemInput): ScoredActionItem[] {
  const scored: ScoredActionItem[] = [
    ...input.overdueRents.map(scoreOverdueRent),
    ...input.expiringCompliance.map(scoreCompliance),
    ...input.endingTenancies.map(scoreTenancy),
    ...input.openMaintenance.map(scoreMaintenance),
  ];

  return scored
    .sort((a, b) => {
      // Primary: priority score desc.
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: within the same score class, surface the more urgent
      // item first (e.g. more overdue rent days, fewer days until compliance
      // expiry/tenancy end). Items without a daysDue field fall to the end
      // of their score class.
      const aDays = a.daysDue ?? -Infinity;
      const bDays = b.daysDue ?? -Infinity;
      return bDays - aDays;
    })
    .slice(0, 5);
}
