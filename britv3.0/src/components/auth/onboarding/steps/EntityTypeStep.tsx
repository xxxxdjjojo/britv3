"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building, User } from "lucide-react";

type EntityType = "ltd_company" | "sole_trader";

const ENTITY_OPTIONS = [
  {
    value: "ltd_company" as const,
    label: "Limited Company",
    description: "Registered with Companies House. Has a company number (e.g. 01234567).",
    icon: Building,
    details: [
      "Companies House verification",
      "Director confirmation",
      "SIC code validation",
    ],
  },
  {
    value: "sole_trader" as const,
    label: "Sole Trader",
    description: "Self-employed individual. Not registered at Companies House.",
    icon: User,
    details: [
      "UTR number (10 digits)",
      "Trading name",
      "HMRC AML reference",
    ],
  },
] as const;

export function EntityTypeStep(
  props: Readonly<{
    defaultValue?: EntityType;
    onSubmit: (entityType: EntityType) => void;
    onBack: () => void;
  }>,
) {
  const [selected, setSelected] = useState<EntityType | null>(props.defaultValue ?? null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Business Entity Type
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          How is your business structured? This determines which verification steps apply.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ENTITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={cn(
                "flex flex-col rounded-xl border-2 p-5 text-left transition-all",
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-300",
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  isSelected ? "bg-brand-primary text-white" : "bg-neutral-100 text-neutral-500",
                )}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">{option.label}</h3>
              </div>
              <p className="mb-3 text-xs text-neutral-500">{option.description}</p>
              <ul className="space-y-1">
                {option.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2 text-xs text-neutral-600">
                    <span className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-brand-primary" : "bg-neutral-300",
                    )} />
                    {detail}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => selected && props.onSubmit(selected)}
          disabled={!selected}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
