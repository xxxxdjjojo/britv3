"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

export type OnboardingSection = Readonly<{
  id: string;
  label: string;
  icon: string;
  steps: number[];
}>;

const SECTIONS: OnboardingSection[] = [
  { id: "identity", label: "Identity", icon: "fingerprint", steps: [1, 2, 3] },
  { id: "verification", label: "Verification", icon: "verified", steps: [4, 5, 6] },
  { id: "profile", label: "Profile", icon: "person", steps: [7, 8] },
  { id: "expertise", label: "Expertise", icon: "workspace_premium", steps: [9, 10] },
  { id: "presence", label: "Social Presence", icon: "share", steps: [11] },
  { id: "launch", label: "Go Live", icon: "rocket_launch", steps: [12] },
];

export function ProfessionalOnboardingLayout(
  props: Readonly<{
    currentStep: number;
    totalSteps: number;
    stepLabel: string;
    subtitle?: string;
    trustCallout?: React.ReactNode;
    children: React.ReactNode;
  }>,
) {
  const progress = Math.round((props.currentStep / props.totalSteps) * 100);

  function getSectionState(section: OnboardingSection) {
    const minStep = Math.min(...section.steps);
    const maxStep = Math.max(...section.steps);
    if (props.currentStep > maxStep) return "completed";
    if (props.currentStep >= minStep && props.currentStep <= maxStep) return "active";
    return "upcoming";
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-neutral-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white py-10 md:flex">
        {/* Brand */}
        <div className="mb-8 px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary">
              <span className="font-heading text-sm font-bold text-white">B</span>
            </div>
            <span className="font-heading text-lg font-bold text-neutral-900">Britestate</span>
          </Link>
          <p className="mt-1 text-xs text-neutral-400">Professional Onboarding</p>
        </div>

        {/* Section nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {SECTIONS.map((section) => {
            const state = getSectionState(section);
            return (
              <div
                key={section.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-all",
                  state === "active" && "border-l-[3px] border-brand-primary bg-brand-primary/5 text-brand-primary",
                  state === "completed" && "text-emerald-600",
                  state === "upcoming" && "text-neutral-400",
                )}
              >
                {state === "completed" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      state === "active" && "bg-brand-primary",
                      state === "upcoming" && "bg-neutral-300",
                    )}
                  />
                )}
                <span>{section.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Top bar with progress */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#D4A853]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D4A853]">
              Step {props.currentStep} of {props.totalSteps}
            </span>
            <span className="text-sm font-medium text-neutral-600">{props.stepLabel}</span>
          </div>
          <span className="text-xs font-semibold text-neutral-400">
            {progress}% Complete
          </span>
        </div>

        {/* Content area */}
        <div className="flex flex-1 gap-8 overflow-y-auto px-6 py-8 md:px-10 lg:px-16">
          {/* Form column */}
          <div className="flex-1 max-w-2xl">
            {props.subtitle && (
              <p className="mb-6 text-sm text-neutral-500">{props.subtitle}</p>
            )}
            {props.children}
          </div>

          {/* Trust callout column — desktop only */}
          {props.trustCallout && (
            <div className="hidden w-72 flex-shrink-0 lg:block">
              {props.trustCallout}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
