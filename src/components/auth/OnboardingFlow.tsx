"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingConfig = Readonly<{
  title: string;
  fields: readonly { name: string; label: string; placeholder: string; type?: string }[];
}>;

const ONBOARDING_CONFIG: Record<string, OnboardingConfig> = {
  landlord: {
    title: "Tell us about your portfolio",
    fields: [
      { name: "portfolioSize", label: "Number of properties", placeholder: "e.g. 3", type: "number" },
    ],
  },
  agent: {
    title: "Tell us about your agency",
    fields: [
      { name: "agencyName", label: "Agency name", placeholder: "e.g. Smith & Partners" },
      { name: "licenseNumber", label: "License number", placeholder: "e.g. ARLA-12345" },
      { name: "coverageArea", label: "Coverage area", placeholder: "e.g. Greater London" },
    ],
  },
  service_provider: {
    title: "Tell us about your services",
    fields: [
      { name: "tradeCategory", label: "Trade category", placeholder: "e.g. Conveyancing, Surveys" },
      { name: "coverageArea", label: "Coverage area", placeholder: "e.g. South East England" },
    ],
  },
};

export function OnboardingFlow(
  props: Readonly<{
    role: string;
  }>,
) {
  const router = useRouter();
  const config = ONBOARDING_CONFIG[props.role];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // If no config for this role, redirect to dashboard
  if (!config) {
    router.push("/dashboard");
    return null;
  }

  function handleChange(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleComplete() {
    setSaving(true);
    // Preferences will be saved in later phases when the tables exist.
    // For now, just redirect to the dashboard.
    router.push("/dashboard");
  }

  function handleSkip() {
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">{config.title}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          This helps us personalise your experience. You can update these later.
        </p>
      </div>

      <div className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={formData[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleSkip}
          className="flex-1"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleComplete}
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Saving..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
}
