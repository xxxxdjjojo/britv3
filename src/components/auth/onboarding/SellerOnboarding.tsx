"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const STEPS = ["Your Property", "Property Details", "Selling Intent"];
const PROPERTY_TYPES = ["Flat", "House", "Bungalow", "New Build", "Terraced", "Semi-detached"];
const TENURES = ["Freehold", "Leasehold", "Share of Freehold"];
const EPC_RATINGS = ["A", "B", "C", "D", "E", "F", "G", "Unknown"];
const TIMELINES = [
  { label: "ASAP", value: "asap" },
  { label: "3 months", value: "3_months" },
  { label: "6 months", value: "6_months" },
  { label: "12+ months", value: "12_plus_months" },
];
const AGENT_PREFS = [
  { label: "Use Britestate", value: "britestate" },
  { label: "Have an agent", value: "have_agent" },
  { label: "Undecided", value: "undecided" },
];

export function SellerOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);

  // Step 2
  const [tenure, setTenure] = useState("");
  const [epc, setEpc] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(300000);

  // Step 3
  const [timeline, setTimeline] = useState("");
  const [agentPref, setAgentPref] = useState("");

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Create property record
        const { data: property } = await supabase
          .from("properties")
          .insert({
            owner_id: user.id,
            address_line1: sanitize(address),
            property_type: propertyType,
            bedrooms,
            bathrooms,
            tenure,
            epc_rating: epc,
            estimated_value: estimatedValue,
            status: "draft",
          })
          .select("id")
          .single();

        // Create seller profile
        await supabase.from("seller_profiles").upsert(
          {
            user_id: user.id,
            property_id: property?.id,
            timeline,
            agent_preference: agentPref,
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
    <button
      type="button"
      onClick={props.onSkip}
      className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600"
    >
      Skip for now
    </button>
  );

  const Stepper = ({
    back,
    next,
    nextLabel = "Continue",
    nextDisabled = false,
  }: {
    back?: () => void;
    next: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
  }) => (
    <div className="flex gap-3">
      {back && (
        <Button variant="outline" onClick={back} className="flex-1">
          Back
        </Button>
      )}
      <Button onClick={next} disabled={nextDisabled} className="flex-1">
        {nextLabel}
      </Button>
    </div>
  );

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={step}
      title={
        ["Tell us about your property", "Property details", "When are you selling?"][step]
      }
      subtitle="This helps us connect you with the right buyers."
    >
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Property address</Label>
            <Input
              placeholder="e.g. 12 High Street, London, EC1A 1BB"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Property type</Label>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPropertyType(t)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors",
                    propertyType === t
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                  className="flex size-8 items-center justify-center rounded-full border border-neutral-300"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{bedrooms}</span>
                <button
                  onClick={() => setBedrooms(bedrooms + 1)}
                  className="flex size-8 items-center justify-center rounded-full border border-neutral-300"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBathrooms(Math.max(0, bathrooms - 1))}
                  className="flex size-8 items-center justify-center rounded-full border border-neutral-300"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{bathrooms}</span>
                <button
                  onClick={() => setBathrooms(bathrooms + 1)}
                  className="flex size-8 items-center justify-center rounded-full border border-neutral-300"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <Stepper next={() => setStep(1)} />
          <SkipLink />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tenure</Label>
            <div className="grid grid-cols-3 gap-2">
              {TENURES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTenure(t)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors",
                    tenure === t
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-neutral-200 text-neutral-700",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>EPC Rating</Label>
            <div className="flex flex-wrap gap-2">
              {EPC_RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEpc(r)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors",
                    epc === r
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 text-neutral-700",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estimated value</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                £
              </span>
              <Input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="h-11 pl-7"
              />
            </div>
          </div>
          <Stepper back={() => setStep(0)} next={() => setStep(2)} />
          <SkipLink />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Timeline</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIMELINES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTimeline(t.value)}
                  className={cn(
                    "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                    timeline === t.value
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-neutral-200 text-neutral-700",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Agent preference</Label>
            <div className="grid grid-cols-3 gap-2">
              {AGENT_PREFS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAgentPref(a.value)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors",
                    agentPref === a.value
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-neutral-200 text-neutral-700",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <Stepper
            back={() => setStep(1)}
            next={handleComplete}
            nextLabel={saving ? "Saving…" : "Complete Setup"}
            nextDisabled={saving}
          />
        </div>
      )}
    </OnboardingLayout>
  );
}
