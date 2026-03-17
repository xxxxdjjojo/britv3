"use client";

import { Eye, EyeOff, Users } from "lucide-react";

type QuickPrivacyModeProps = Readonly<{
  currentMode: "public" | "members" | "ghost";
  onModeChange: (mode: "public" | "members" | "ghost") => void;
}>;

const modes = [
  {
    key: "public" as const,
    label: "Public",
    description: "Visible to everyone",
    icon: Eye,
  },
  {
    key: "members" as const,
    label: "Members Only",
    description: "Registered users only",
    icon: Users,
  },
  {
    key: "ghost" as const,
    label: "Ghost Mode",
    description: "Maximum privacy",
    icon: EyeOff,
  },
];

export function QuickPrivacyMode({
  currentMode,
  onModeChange,
}: QuickPrivacyModeProps) {
  return (
    <section className="rounded-lg border border-neutral-200 p-6">
      <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
        Quick Privacy Mode
      </h3>
      <p className="mt-1 font-body text-sm text-neutral-500">
        Choose a preset to quickly adjust all your privacy settings at once.
      </p>

      <div className="mt-4 flex gap-2">
        {modes.map((mode) => {
          const isActive = currentMode === mode.key;
          const Icon = mode.icon;
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => onModeChange(mode.key)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-colors ${
                isActive
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-150"
              }`}
            >
              <Icon className="size-5" />
              <span className="font-body text-sm font-medium">
                {mode.label}
              </span>
              <span
                className={`font-body text-xs ${isActive ? "text-white/80" : "text-neutral-500"}`}
              >
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
