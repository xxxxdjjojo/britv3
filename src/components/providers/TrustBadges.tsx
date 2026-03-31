/**
 * TrustBadges — Server Component
 *
 * "Invisible Estate" design: soft background-shift pill badges, no borders.
 * Renders accreditation/verification trust signals for a provider profile.
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
  bg: string;
  text: string;
  Icon: LucideIcon;
};

const BADGE_CONFIG: Record<BadgeKey, BadgeConfigEntry> = {
  britestate_verified: {
    label: "Britestate Verified",
    bg: "bg-[#1B4D3E]/10 dark:bg-[#1B4D3E]/20",
    text: "text-[#1B4D3E] dark:text-[#4ade80]",
    Icon: ShieldCheck,
  },
  gas_safe: {
    label: "Gas Safe",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-400",
    Icon: Flame,
  },
  niceic: {
    label: "NICEIC",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-400",
    Icon: Zap,
  },
  fca: {
    label: "FCA Regulated",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-800 dark:text-blue-400",
    Icon: BadgeCheck,
  },
  rics: {
    label: "RICS Member",
    bg: "bg-[#1B4D3E]/10 dark:bg-[#1B4D3E]/20",
    text: "text-[#1B4D3E] dark:text-[#4ade80]",
    Icon: Building2,
  },
  sra: {
    label: "SRA Regulated",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    Icon: Scale,
  },
  clc: {
    label: "CLC Regulated",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    Icon: Scale,
  },
  insured: {
    label: "Insured",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    Icon: Shield,
  },
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
    badges.push({ key: "britestate_verified", title: "Britestate Verified" });
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
    <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="Trust credentials">
      {badges.map(({ key, title }) => {
        const config = BADGE_CONFIG[key];
        const { Icon } = config;
        return (
          <span
            key={`${key}-${title}`}
            title={title}
            role="listitem"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${config.bg} ${config.text}`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
