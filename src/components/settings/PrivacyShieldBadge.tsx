"use client";

import Link from "next/link";
import { Shield, Eye, Users, EyeOff } from "lucide-react";

type PrivacyShieldBadgeProps = Readonly<{
  mode: "public" | "members" | "ghost";
}>;

const MODE_CONFIG = {
  public: {
    label: "Public",
    description: "Your profile is visible to everyone",
    icon: Eye,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  members: {
    label: "Members Only",
    description: "Only registered users can see you",
    icon: Users,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  ghost: {
    label: "Ghost Mode",
    description: "Maximum privacy — you're invisible",
    icon: EyeOff,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
} as const;

export function PrivacyShieldBadge({ mode }: PrivacyShieldBadgeProps) {
  const config = MODE_CONFIG[mode];
  const ModeIcon = config.icon;

  return (
    <Link
      href="/settings/privacy"
      className={`block rounded-lg border p-4 transition-colors hover:opacity-90 ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
          <Shield className={`size-5 ${config.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <ModeIcon className={`size-3.5 ${config.color}`} />
            <span className={`font-heading text-sm font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="mt-0.5 font-body text-xs text-neutral-600 dark:text-neutral-400">
            {config.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
