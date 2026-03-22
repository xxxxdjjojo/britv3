"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { cn } from "@/lib/utils";
import { Check, Shield } from "lucide-react";

const PROFESSIONAL_BODIES = [
  { id: "naea", name: "NAEA Propertymark", description: "National Association of Estate Agents" },
  { id: "arla", name: "ARLA Propertymark", description: "Association of Residential Letting Agents" },
  { id: "rics", name: "RICS", description: "Royal Institution of Chartered Surveyors" },
  { id: "hmrc_aml", name: "HMRC AML Supervision", description: "Anti-Money Laundering registered with HMRC" },
] as const;

type SelectedBody = {
  id: string;
  membershipNumber: string;
};

export function ProfessionalBodyStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: () => void;
    onBack: () => void;
    onSkip: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [selected, setSelected] = useState<SelectedBody[]>([]);

  function toggleBody(id: string) {
    if (selected.find((s) => s.id === id)) {
      setSelected(selected.filter((s) => s.id !== id));
    } else {
      setSelected([...selected, { id, membershipNumber: "" }]);
    }
  }

  function updateMembershipNumber(id: string, value: string) {
    setSelected(selected.map((s) => s.id === id ? { ...s, membershipNumber: value } : s));
  }

  async function handleSubmit() {
    if (selected.length === 0) return;

    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save each membership as a provider_verification
      for (const body of selected) {
        await supabase.from("provider_verifications").upsert(
          {
            user_id: user.id,
            stage: "qualifications",
            status: "submitted",
            document_url: `${body.id}:${body.membershipNumber}`,
          },
          { onConflict: "user_id,stage" },
        );
      }
      return selected;
    });

    if (result) props.onSubmit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Professional Body Memberships
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Select any professional bodies you are a member of. This boosts your trust score.
        </p>
      </div>

      <div className="space-y-3">
        {PROFESSIONAL_BODIES.map((body) => {
          const isSelected = selected.some((s) => s.id === body.id);
          const entry = selected.find((s) => s.id === body.id);

          return (
            <div key={body.id} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleBody(body.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-neutral-200 hover:border-neutral-300",
                )}
              >
                <div className={cn(
                  "flex size-5 items-center justify-center rounded",
                  isSelected ? "bg-brand-primary text-white" : "border border-neutral-300",
                )}>
                  {isSelected && <Check className="size-3.5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-neutral-400" />
                    <span className="text-sm font-semibold text-neutral-900">{body.name}</span>
                  </div>
                  <p className="ml-6 text-xs text-neutral-500">{body.description}</p>
                </div>
              </button>

              {isSelected && entry && (
                <div className="ml-8 space-y-1">
                  <Label className="text-xs">Membership Number</Label>
                  <Input
                    placeholder="Enter your membership number"
                    value={entry.membershipNumber}
                    onChange={(e) => updateMembershipNumber(body.id, e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || selected.length === 0}
          className="flex-1"
        >
          {saving ? "Saving..." : "Save and Continue"}
        </Button>
      </div>

      <button
        type="button"
        onClick={props.onSkip}
        className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600"
      >
        Skip for now
      </button>
    </div>
  );
}
