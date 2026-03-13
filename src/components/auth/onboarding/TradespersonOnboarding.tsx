"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STEPS = ["Trade Category", "Coverage Area", "Credentials", "Availability"];
const TRADE_CATEGORIES = [
  "Plumber", "Electrician", "Carpenter", "Surveyor", "Conveyancer",
  "Gas Engineer", "Painter & Decorator", "Builder", "Roofer", "Plasterer",
];
const UK_REGIONS = [
  "London", "South East", "East of England", "South West",
  "West Midlands", "East Midlands", "Yorkshire", "North West",
  "North East", "Wales", "Scotland",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RESPONSE_TIMES = [
  { label: "Same day", value: "same_day" },
  { label: "24 hours", value: "24h" },
  { label: "48 hours", value: "48h" },
  { label: "1 week", value: "1_week" },
];
const ACCREDITATIONS = ["Gas Safe", "NICEIC", "NAPIT", "CHAS", "TrustMark", "Which? Trusted Trader"];

export function TradespersonOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [tradeCategories, setTradeCategories] = useState<string[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [accreditations, setAccreditations] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [responseTime, setResponseTime] = useState("24h");

  function toggle<T extends string>(items: T[], item: T, setter: (v: T[]) => void) {
    setter(items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("service_provider_profiles").upsert(
          {
            user_id: user.id,
            trade_categories: tradeCategories,
            qualifications,
            insurance_policy_number: insuranceNumber,
            accreditations,
            available_days: availableDays,
            response_time: responseTime,
          },
          { onConflict: "user_id" },
        );
        if (coverageAreas.length > 0) {
          await supabase.from("provider_service_areas").upsert(
            coverageAreas.map((area) => ({ user_id: user.id, area })),
            { onConflict: "user_id,area" },
          );
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setSaving(false);
    }
    props.onComplete();
  }

  const SkipLink = () => (
    <button type="button" onClick={props.onSkip} className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600">Skip for now</button>
  );

  const titles = ["What's your trade?", "Where do you work?", "Your credentials", "Your availability"];

  return (
    <OnboardingLayout steps={STEPS} currentStep={step} title={titles[step]} subtitle="This helps clients find you for the right jobs.">
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TRADE_CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => toggle(tradeCategories, cat, setTradeCategories)} className={cn("rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors", tradeCategories.includes(cat) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                {cat}
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(1)} className="w-full" disabled={tradeCategories.length === 0}>Continue</Button>
          <SkipLink />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {UK_REGIONS.map((region) => (
              <button key={region} type="button" onClick={() => toggle(coverageAreas, region, setCoverageAreas)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", coverageAreas.includes(region) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                {region}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(2)} className="flex-1">Continue</Button>
          </div>
          <SkipLink />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Qualifications <span className="text-neutral-400 text-xs">(optional)</span></Label>
            <Input placeholder="e.g. NVQ Level 3 Plumbing" value={qualifications} onChange={(e) => setQualifications(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Insurance policy number <span className="text-neutral-400 text-xs">(optional)</span></Label>
            <Input placeholder="e.g. POL-12345678" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Accreditations</Label>
            <div className="flex flex-wrap gap-1.5">
              {ACCREDITATIONS.map((acc) => (
                <button key={acc} type="button" onClick={() => toggle(accreditations, acc, setAccreditations)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", accreditations.includes(acc) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                  {acc}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
          </div>
          <SkipLink />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Available days</Label>
            <div className="flex gap-2">
              {DAYS.map((day) => (
                <button key={day} type="button" onClick={() => toggle(availableDays, day, setAvailableDays)} className={cn("flex-1 rounded-lg border-2 py-2 text-xs font-medium transition-colors", availableDays.includes(day) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-200 text-neutral-600")}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Response time</Label>
            <div className="grid grid-cols-2 gap-2">
              {RESPONSE_TIMES.map((rt) => (
                <button key={rt.value} type="button" onClick={() => setResponseTime(rt.value)} className={cn("rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors", responseTime === rt.value ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-neutral-200 text-neutral-700")}>
                  {rt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button onClick={handleComplete} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
