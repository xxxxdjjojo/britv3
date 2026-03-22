"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { validateUKPhone, normalizeUKPhone } from "@/lib/validators/uk";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const EXPERIENCE_OPTIONS = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];
const TRANSACTION_OPTIONS = ["0-50", "50-100", "100-500", "500+"];
const LANGUAGES = [
  "English", "Welsh", "Polish", "Urdu", "Punjabi", "Bengali",
  "Gujarati", "Hindi", "Arabic", "Mandarin", "French", "Spanish",
];

export function ProfessionalDetailsStep(
  props: Readonly<{
    stepNumber: number;
    defaultDisplayName?: string;
    defaultAgencyName?: string;
    onSubmit: () => void;
    onBack: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [displayName, setDisplayName] = useState(props.defaultDisplayName ?? "");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [transactionsCount, setTransactionsCount] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = "Display name is required";
    if (phone && !validateUKPhone(phone)) errs.phone = "Enter a valid UK phone number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("agent_profiles").upsert(
        {
          user_id: user.id,
          professional_title: sanitize(title) || null,
          phone_uk: phone ? normalizeUKPhone(phone) : null,
          years_experience: EXPERIENCE_OPTIONS.indexOf(yearsExperience) >= 0
            ? parseInt(yearsExperience) || null
            : null,
          transactions_count: transactionsCount || null,
          languages_spoken: languages,
        },
        { onConflict: "user_id" },
      );

      // Update display name on profiles
      await supabase.from("profiles").update({
        display_name: sanitize(displayName),
      }).eq("id", user.id);

      return true;
    });

    if (result) props.onSubmit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Professional Details
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tell potential clients about your experience and expertise.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Display Name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="e.g. John Smith"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11"
          />
          {errors.displayName && <p className="text-xs text-red-600">{errors.displayName}</p>}
        </div>

        <div className="space-y-2">
          <Label>Professional Title</Label>
          <Input
            placeholder="e.g. Senior Sales Negotiator"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input
            placeholder="e.g. 07911 123456 or +447911123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11"
          />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Years of Experience</Label>
            <select
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="">Select...</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Transactions Completed</Label>
            <select
              value={transactionsCount}
              onChange={(e) => setTransactionsCount(e.target.value)}
              className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="">Select...</option>
              {TRANSACTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Languages Spoken</Label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  languages.includes(lang)
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-brand-primary",
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button onClick={handleSubmit} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save and Continue"}
        </Button>
      </div>
    </div>
  );
}
