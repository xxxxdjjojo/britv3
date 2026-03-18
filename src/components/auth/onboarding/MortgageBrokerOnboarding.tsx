"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const STEPS = ["Your Firm", "Specialisms", "Coverage"];
const SPECIALISMS = [
  { label: "First-time Buyers", value: "first_time_buyers" },
  { label: "Buy-to-Let", value: "buy_to_let" },
  { label: "Remortgage", value: "remortgage" },
  { label: "Self-Employed", value: "self_employed" },
  { label: "Commercial", value: "commercial" },
  { label: "Shared Ownership", value: "shared_ownership" },
];
const UK_REGIONS = [
  "London", "South East", "East of England", "South West",
  "West Midlands", "East Midlands", "Yorkshire", "North West",
  "North East", "Wales", "Scotland",
];

export function MortgageBrokerOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [firmName, setFirmName] = useState("");
  const [fcaNumber, setFcaNumber] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [specialisms, setSpecialisms] = useState<string[]>([]);
  const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState<"remote" | "in_person" | "both">("both");
  const [maxClients, setMaxClients] = useState(20);

  function toggleItem<T extends string>(items: T[], item: T, setter: (v: T[]) => void) {
    setter(items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("mortgage_broker_profiles").upsert(
          {
            user_id: user.id,
            firm_name: sanitize(firmName),
            fca_reference: sanitize(fcaNumber),
            office_address: sanitize(officeAddress),
            specialisms,
            coverage_regions: coverageRegions,
            work_style: workStyle,
            max_clients_per_month: maxClients,
          },
          { onConflict: "user_id" },
        );
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

  return (
    <OnboardingLayout steps={STEPS} currentStep={step} title={["Tell us about your firm", "What are your specialisms?", "Where do you operate?"][step]} subtitle="We'll connect you with clients looking for mortgage advice.">
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Firm name</Label>
            <Input placeholder="e.g. Bright Mortgages Ltd" value={firmName} onChange={(e) => setFirmName(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>FCA reference number <span className="text-neutral-400 text-xs">(6 digits)</span></Label>
            <Input placeholder="e.g. 123456" maxLength={6} value={fcaNumber} onChange={(e) => setFcaNumber(e.target.value.replace(/\D/g, ""))} className="h-11 font-mono tracking-widest" />
          </div>
          <div className="space-y-2">
            <Label>Office address <span className="text-neutral-400 text-xs">(optional)</span></Label>
            <Input placeholder="e.g. 5 Finance Street, Leeds, LS1 1AA" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} className="h-11" />
          </div>
          <Button onClick={() => setStep(1)} className="w-full" disabled={!firmName}>Continue</Button>
          <SkipLink />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {SPECIALISMS.map((s) => (
              <button key={s.value} type="button" onClick={() => toggleItem(specialisms, s.value, setSpecialisms)} className={cn("rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors text-left", specialisms.includes(s.value) ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-neutral-200 text-neutral-700 hover:border-neutral-300")}>
                {s.label}
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
            <Label>Regions served</Label>
            <div className="flex flex-wrap gap-1.5">
              {UK_REGIONS.map((region) => (
                <button key={region} type="button" onClick={() => toggleItem(coverageRegions, region, setCoverageRegions)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", coverageRegions.includes(region) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                  {region}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>How do you work with clients?</Label>
            <div className="grid grid-cols-3 gap-2">
              {([["remote", "Remote"], ["in_person", "In-person"], ["both", "Both"]] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setWorkStyle(val)} className={cn("rounded-lg border-2 py-2 text-sm font-medium transition-colors", workStyle === val ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-neutral-200 text-neutral-700")}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Max clients per month</Label>
            <div className="flex items-center gap-3">
              <button onClick={() => setMaxClients(Math.max(1, maxClients - 5))} className="flex size-8 items-center justify-center rounded-full border border-neutral-300">-</button>
              <span className="w-10 text-center font-medium">{maxClients}</span>
              <button onClick={() => setMaxClients(maxClients + 5)} className="flex size-8 items-center justify-center rounded-full border border-neutral-300">+</button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={handleComplete} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
