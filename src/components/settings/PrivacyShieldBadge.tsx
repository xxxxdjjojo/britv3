
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
      color: "text-success",
      iconColor: "text-success",
      description: "Full privacy protection",
    };
  }

  if (visibility === "registered_only" || (visibility === "private" && !allSharingOff)) {
    return {
      level: "High",
      color: "text-info",
      iconColor: "text-info",
      description: "Most data is hidden",
    };
  }

  if (visibility === "public" && sharingOnCount < sharingFlags.length) {
    return {
      level: "Standard",
      color: "text-warning",
      iconColor: "text-warning",
      description: "Some data is shared",
    };
  }

  return {
    level: "Low",
    color: "text-error",
    iconColor: "text-error",
    description: "Profile fully visible",
  };
}

export function PrivacyShieldBadge(props: PrivacyShieldProps) {
  const { level, color, iconColor, description } = computeLevel(props);
  const Icon = level === "Low" ? ShieldAlert : ShieldCheck;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
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
