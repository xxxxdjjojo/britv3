"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { generateUniqueSlug } from "@/lib/marketplace/provider-slug";
import { buildProviderRow } from "./tradesperson-onboarding-mapping";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [tradeCategories, setTradeCategories] = useState<string[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [accreditations, setAccreditations] = useState<string[]>([]);

  // Companies House verification (only when a limited-company number is provided;
  // sole traders leave it blank and are not gated). The result is recorded
  // server-side; trust fields on `service_provider_details` are set by trigger.
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [responseTime, setResponseTime] = useState("24h");

  function toggle<T extends string>(items: T[], item: T, setter: (v: T[]) => void) {
    setter(items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
  }

  const requiresGasSafe = tradeCategories.includes("Gas Engineer");

  const VERIFY_REASONS: Record<string, string> = {
    company_under_two_years:
      "Companies must be registered with Companies House for at least 2 years to onboard.",
    company_not_found:
      "We couldn't find that company number on Companies House. Please check and try again.",
    company_not_active:
      "This company is not listed as active on Companies House.",
  };

  /** Advance from the Credentials step, verifying the company number first if one was entered. */
  async function handleCredentialsContinue() {
    setVerifyMessage(null);
    const number = companyNumber.trim();

    // Sole traders (no company number) proceed without a Companies House check.
    if (!number) {
      setStep(3);
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/verification/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyNumber: number }),
      });
      const data = await res.json();

      // Eligible or service-unavailable (the server records the authoritative
      // verification; provider trust fields are set by DB trigger). Advance.
      if (data.eligible || data.serviceError) {
        setStep(3);
        return;
      }
      setVerifyMessage(
        VERIFY_REASONS[data.reason as string] ??
          "This company could not be verified for onboarding.",
      );
    } catch {
      // Fail closed: do not advance on a network error.
      setVerifyMessage(
        "We couldn't verify your company right now. Please try again.",
      );
    } finally {
      setVerifying(false);
    }
  }

  // Auto-select Gas Safe when Gas Engineer trade is chosen
  useEffect(() => {
    if (tradeCategories.includes("Gas Engineer") && !accreditations.includes("Gas Safe")) {
      setAccreditations((prev) => [...prev, "Gas Safe"]);
    }
  }, [tradeCategories, accreditations]);

  async function handleComplete() {
    setSaving(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Your session has expired. Please sign in again.");
        return;
      }

      const name = businessName.trim();
      const slug = await generateUniqueSlug(supabase, name);

      const { error } = await supabase.from("service_provider_details").upsert(
        {
          user_id: user.id,
          business_name: name,
          slug,
          ...buildProviderRow({
            tradeCategories,
            qualifications,
            insuranceNumber,
            companyNumber,
            accreditations,
            responseTime,
          }),
        },
        { onConflict: "user_id" },
      );

      // TODO: service areas (coverageAreas) are set later in the provider
      // dashboard, which writes the `provider_service_areas` geometry zones.
      if (error) {
        setErrorMessage("We couldn't save your provider profile. Please try again.");
        return;
      }

      props.onComplete();
    } catch {
      setErrorMessage("We couldn't save your provider profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const SkipLink = () => (
    <button type="button" onClick={props.onSkip} className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600">Skip for now</button>
  );

  const titles = ["What's your trade?", "Where do you work?", "Your credentials", "Your availability"];

  return (
    <OnboardingLayout steps={STEPS} currentStep={step} title={titles[step]} subtitle="This helps clients find you for the right jobs.">
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business or trading name</Label>
            <Input id="business-name" placeholder="e.g. Acme Plumbing Ltd" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TRADE_CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => toggle(tradeCategories, cat, setTradeCategories)} className={cn("rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors", tradeCategories.includes(cat) ? "border-brand-primary bg-brand-primary text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-primary")}>
                {cat}
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(1)} className="w-full" disabled={tradeCategories.length === 0 || businessName.trim().length < 3}>Continue</Button>
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
            <Label>Companies House number <span className="text-neutral-400 text-xs">(limited companies only)</span></Label>
            <Input placeholder="e.g. 09876543" value={companyNumber} onChange={(e) => { setCompanyNumber(e.target.value); setVerifyMessage(null); }} className="h-11" />
            <p className="text-xs text-neutral-400">Limited companies must be registered for at least 2 years. Sole traders can leave this blank.</p>
            {verifyMessage && (
              <p className="text-xs text-red-600">{verifyMessage}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Accreditations</Label>
            <div className="flex flex-wrap gap-1.5">
              {ACCREDITATIONS.map((acc) => {
                const isRequired = requiresGasSafe && acc === "Gas Safe";
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => {
                      if (isRequired) return; // Prevent deselecting mandatory accreditation
                      toggle(accreditations, acc, setAccreditations);
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      accreditations.includes(acc)
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-neutral-300 text-neutral-600 hover:border-brand-primary",
                      isRequired && "cursor-not-allowed"
                    )}
                  >
                    {acc}{isRequired ? " (required)" : ""}
                  </button>
                );
              })}
            </div>
          </div>
          {requiresGasSafe && !accreditations.includes("Gas Safe") && (
            <p className="text-xs text-error">
              Gas Safe registration is legally required for Gas Engineers
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button
              onClick={handleCredentialsContinue}
              className="flex-1"
              disabled={(requiresGasSafe && !accreditations.includes("Gas Safe")) || verifying}
            >
              {verifying ? "Verifying…" : "Continue"}
            </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESPONSE_TIMES.map((rt) => (
                <button key={rt.value} type="button" onClick={() => setResponseTime(rt.value)} className={cn("rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors", responseTime === rt.value ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-neutral-200 text-neutral-700")}>
                  {rt.label}
                </button>
              ))}
            </div>
          </div>
          {errorMessage && (
            <p className="text-xs text-red-600" role="alert">{errorMessage}</p>
          )}
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
