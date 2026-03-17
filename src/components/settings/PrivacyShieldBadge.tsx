"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";

type PrivacyShieldProps = Readonly<{
  visibility: "public" | "registered_only" | "private";
  searchIndexing: boolean;
  thirdPartyMarketing: boolean;
  activeStatus: boolean;
}>;

type PrivacyLevel = "Maximum" | "High" | "Standard" | "Low";

type LevelInfo = Readonly<{
  level: PrivacyLevel;
  color: string;
  iconColor: string;
  description: string;
}>;

function computeLevel({
  visibility,
  searchIndexing,
  thirdPartyMarketing,
  activeStatus,
}: PrivacyShieldProps): LevelInfo {
  const sharingFlags = [searchIndexing, thirdPartyMarketing, activeStatus];
  const sharingOnCount = sharingFlags.filter(Boolean).length;
  const allSharingOff = sharingOnCount === 0;

  if (visibility === "private" && allSharingOff) {
    return {
      level: "Maximum",
      color: "text-green-600",
      iconColor: "text-green-500",
      description: "Full privacy protection",
    };
  }

  if (visibility === "registered_only" || (visibility === "private" && !allSharingOff)) {
    return {
      level: "High",
      color: "text-blue-600",
      iconColor: "text-blue-500",
      description: "Most data is hidden",
    };
  }

  if (visibility === "public" && sharingOnCount < sharingFlags.length) {
    return {
      level: "Standard",
      color: "text-yellow-600",
      iconColor: "text-yellow-500",
      description: "Some data is shared",
    };
  }

  return {
    level: "Low",
    color: "text-red-600",
    iconColor: "text-red-500",
    description: "Profile fully visible",
  };
}

export function PrivacyShieldBadge(props: PrivacyShieldProps) {
  const { level, color, iconColor, description } = computeLevel(props);
  const Icon = level === "Low" ? ShieldAlert : ShieldCheck;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <Icon className={`size-8 shrink-0 ${iconColor}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className={`font-heading text-sm font-bold leading-tight ${color}`}>
          {level}
        </p>
        <p className="font-body text-xs text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
