"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { ProfileScoreRing } from "@/components/ui/ProfileScoreRing";
import { ProfilePreviewCard } from "@/components/ui/ProfilePreviewCard";
import { cn } from "@/lib/utils";
import { Check, Rocket } from "lucide-react";

type Plan = {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly features: readonly string[];
  readonly popular?: boolean;
};

const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "forever",
    features: ["Basic profile listing", "Up to 5 property listings", "Standard search visibility"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "£49",
    period: "/month",
    features: ["Verified badge", "Unlimited listings", "Priority search placement", "Analytics dashboard", "Lead generation tools"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    period: "",
    features: ["Everything in Pro", "Multi-branch support", "API access", "Dedicated account manager", "Custom integrations"],
  },
];

export function PlanGoLiveStep(
  props: Readonly<{
    stepNumber: number;
    displayName: string;
    title?: string;
    agencyName?: string;
    photoUrl?: string;
    serviceAreas?: string[];
    verified: boolean;
    onComplete: () => void;
    onBack: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [score, setScore] = useState(0);

  // Fetch profile score
  useEffect(() => {
    async function fetchScore() {
      try {
        const res = await fetch("/api/profile/score", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setScore(data.score ?? 0);
        }
      } catch {
        // Non-blocking
      }
    }
    fetchScore();
  }, []);

  async function handleGoLive() {
    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Mark onboarding complete
      await supabase.from("profiles").update({
        onboarding_complete: true,
        onboarding_step: props.stepNumber,
      }).eq("id", user.id);

      return true;
    });

    if (result) props.onComplete();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Choose Your Plan & Go Live
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          You&apos;re almost there! Review your profile and choose a plan.
        </p>
      </div>

      {/* Score + Preview side by side */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ProfileScoreRing score={score} size={140} />
        <ProfilePreviewCard
          displayName={props.displayName}
          title={props.title}
          agencyName={props.agencyName}
          photoUrl={props.photoUrl}
          score={score}
          verified={props.verified}
          serviceAreas={props.serviceAreas}
          className="flex-1"
        />
      </div>

      {/* Plan selection */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              "relative flex flex-col rounded-xl border-2 p-5 text-left transition-all",
              selectedPlan === plan.id
                ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                : "border-neutral-200 bg-white hover:border-neutral-300",
              plan.popular && "ring-2 ring-[#D4A853]/30",
            )}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D4A853] px-3 py-0.5 text-[10px] font-bold uppercase text-white">
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
            <div className="mt-1">
              <span className="text-2xl font-bold text-neutral-900">{plan.price}</span>
              {plan.period && <span className="text-xs text-neutral-500">{plan.period}</span>}
            </div>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-xs text-neutral-600">
                  <Check className="size-3.5 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button onClick={handleGoLive} disabled={saving} className="flex-1 gap-2">
          {saving ? "Going live..." : <><Rocket className="size-4" /> Go Live</>}
        </Button>
      </div>
    </div>
  );
}
