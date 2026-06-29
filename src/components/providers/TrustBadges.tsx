/**
 * TrustBadges — Server Component
 *
 * Renders a horizontal flex-wrap row of accreditation/verification badge pills
 * for a service provider's public profile page.
 */

import { ShieldCheck, Flame, Zap, BadgeCheck, Building2, Scale, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type BadgeKey =
  | "britestate_verified"
  | "gas_safe"
  | "niceic"
  | "fca"
  | "rics"
  | "sra"
  | "clc"
  | "insured";

type BadgeConfigEntry = {
  label: string;
  color: string;
  Icon: LucideIcon;
};

const BADGE_CONFIG: Record<BadgeKey, BadgeConfigEntry> = {
  britestate_verified: { label: "TrueDeed Verified", color: "bg-brand-primary", Icon: ShieldCheck },
  gas_safe: { label: "Gas Safe", color: "bg-orange-600", Icon: Flame },
  niceic: { label: "NICEIC", color: "bg-orange-500", Icon: Zap },
  fca: { label: "FCA Regulated", color: "bg-brand-primary-dark", Icon: BadgeCheck },
  rics: { label: "RICS Member", color: "bg-brand-primary", Icon: Building2 },
  sra: { label: "SRA Regulated", color: "bg-brand-primary-dark", Icon: Scale },
  clc: { label: "CLC Regulated", color: "bg-brand-primary", Icon: Scale },
  insured: { label: "Insured", color: "bg-green-600", Icon: Shield },
};

type Accreditation = {
  type: string;
  number?: string;
  expires?: string;
};

type TrustBadgesProps = Readonly<{
  accreditations: Accreditation[];
  insuranceDetails: Record<string, unknown> | null;
  verificationStatus: string;
}>;

export default function TrustBadges({
  accreditations,
  insuranceDetails,
  verificationStatus,
}: TrustBadgesProps) {
  const badges: { key: BadgeKey; title: string }[] = [];

  if (verificationStatus === "verified") {
    badges.push({ key: "britestate_verified", title: "TrueDeed Verified" });
  }

  if (insuranceDetails !== null) {
    badges.push({ key: "insured", title: "Insured" });
  }

  for (const accreditation of accreditations) {
    const key = accreditation.type.toLowerCase().replace(/[^a-z_]/g, "_") as BadgeKey;
    if (key in BADGE_CONFIG) {
      let titleText = "";
      if (accreditation.expires) {
        titleText = `Verified ${accreditation.expires}`;
      } else if (accreditation.number) {
        titleText = `Registered ${accreditation.number}`;
      } else {
        titleText = BADGE_CONFIG[key].label;
      }
      badges.push({ key, title: titleText });
    }
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {badges.map(({ key, title }) => {
        const config = BADGE_CONFIG[key];
        const { Icon } = config;
        return (
          <span
            key={`${key}-${title}`}
            title={title}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white ${config.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
