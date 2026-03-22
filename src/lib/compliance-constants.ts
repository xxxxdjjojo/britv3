/**
 * Compliance requirement metadata — single source of truth.
 * Used by: CertificateStatusTile, compliance/page.tsx, ComplianceMatrix.
 *
 * REQUIREMENTS MAP:
 *   Standard property  → gas_safety, electrical_eicr, epc, deposit_protection, smoke_co_alarms
 *   HMO (is_hmo=true)  → all standard + hmo_licence, fire_safety
 */

import {
  FlameKindling,
  Zap,
  Leaf,
  Shield,
  Siren,
  Home,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ComplianceCategoryKey =
  | "gas_safety"
  | "electrical_eicr"
  | "epc"
  | "deposit_protection"
  | "smoke_co_alarms"
  | "hmo_licence"
  | "fire_safety";

export type ComplianceCategoryMeta = Readonly<{
  key: ComplianceCategoryKey;
  label: string;
  icon: LucideIcon;
  description: string;
  renewalPeriod: string;
  hmoOnly: boolean;
}>;

export const COMPLIANCE_CATEGORIES: ComplianceCategoryMeta[] = [
  {
    key: "gas_safety",
    label: "Gas Safety",
    icon: FlameKindling,
    description: "Annual CP12 certificate",
    renewalPeriod: "Annual",
    hmoOnly: false,
  },
  {
    key: "electrical_eicr",
    label: "Electrical (EICR)",
    icon: Zap,
    description: "Every 5 years or on tenancy change",
    renewalPeriod: "5 years",
    hmoOnly: false,
  },
  {
    key: "epc",
    label: "Energy Performance",
    icon: Leaf,
    description: "10-year cert, minimum E rating",
    renewalPeriod: "10 years",
    hmoOnly: false,
  },
  {
    key: "deposit_protection",
    label: "Deposit Protection",
    icon: Shield,
    description: "Must register within 30 days",
    renewalPeriod: "Per tenancy",
    hmoOnly: false,
  },
  {
    key: "smoke_co_alarms",
    label: "Smoke & CO Alarms",
    icon: Siren,
    description: "Working alarms on every floor",
    renewalPeriod: "Annual check",
    hmoOnly: false,
  },
  {
    key: "hmo_licence",
    label: "HMO Licence",
    icon: Home,
    description: "Mandatory for qualifying HMOs",
    renewalPeriod: "5 years (renewal takes 8-12 weeks)",
    hmoOnly: true,
  },
  {
    key: "fire_safety",
    label: "Fire Safety",
    icon: Flame,
    description: "Fire doors, extinguishers, escape routes",
    renewalPeriod: "Annual assessment",
    hmoOnly: true,
  },
];

/** Get categories applicable to a property based on HMO status */
export function getRequiredCategories(isHmo: boolean): ComplianceCategoryMeta[] {
  return COMPLIANCE_CATEGORIES.filter((c) => !c.hmoOnly || isHmo);
}

/** Lookup a category by key */
export function getCategoryMeta(key: string): ComplianceCategoryMeta | undefined {
  return COMPLIANCE_CATEGORIES.find((c) => c.key === key);
}

/** Label map for backward compatibility */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  COMPLIANCE_CATEGORIES.map((c) => [c.key, c.label]),
);
