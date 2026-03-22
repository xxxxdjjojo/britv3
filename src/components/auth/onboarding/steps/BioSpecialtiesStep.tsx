"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const SPECIALTIES = [
  "First-time Buyers", "Investors", "Landlords", "Downsizers",
  "HMO", "Luxury", "New Build", "Auction", "Commercial",
];
const MAX_WORDS = 200;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function BioSpecialtiesStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: () => void;
    onBack: () => void;
    onSkip: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  const words = wordCount(bio);
  const overLimit = words > MAX_WORDS;

  async function handleSubmit() {
    if (overLimit) return;

    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("agent_profiles").upsert(
        {
          user_id: user.id,
          bio: sanitize(bio) || null,
          specialties: specialties.length > 0 ? specialties : null,
        },
        { onConflict: "user_id" },
      );
      return true;
    });

    if (result) props.onSubmit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Bio & Specialties
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tell potential clients about yourself and what you specialise in.
        </p>
      </div>

      <div className="space-y-2">
        <Label>About You</Label>
        <textarea
          placeholder="Tell clients about your experience, approach, and what makes you stand out..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
        <p className={cn("text-right text-xs", overLimit ? "text-red-600 font-semibold" : "text-neutral-400")}>
          {words}/{MAX_WORDS} words
        </p>
      </div>

      <div className="space-y-2">
        <Label>Specialties</Label>
        <div className="flex flex-wrap gap-1.5">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                specialties.includes(s)
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-brand-primary",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button onClick={handleSubmit} disabled={saving || overLimit} className="flex-1">
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
