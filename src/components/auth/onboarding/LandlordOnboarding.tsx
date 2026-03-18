"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

const STEPS = ["Your Portfolio", "First Property", "Compliance Docs"];
const PORTFOLIO_TYPES = ["Flat", "House", "HMO", "Student", "Commercial"];

type DocType = "gas_safety" | "epc" | "eicr";
type UploadedDoc = { type: DocType; name: string };

export function LandlordOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Portfolio
  const [portfolioSize, setPortfolioSize] = useState(1);
  const [portfolioTypes, setPortfolioTypes] = useState<string[]>([]);

  // Step 2 — First property
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState(2);
  const [monthlyRent, setMonthlyRent] = useState(1200);

  // Step 3 — Compliance docs
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocType, setPendingDocType] = useState<DocType | null>(null);

  function toggleType(type: string) {
    setPortfolioTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && pendingDocType) {
      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.type !== pendingDocType),
        { type: pendingDocType, name: file.name },
      ]);
    }
    setPendingDocType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function triggerUpload(docType: DocType) {
    setPendingDocType(docType);
    fileInputRef.current?.click();
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Landlord profile
        await supabase.from("landlord_profiles").upsert(
          {
            user_id: user.id,
            portfolio_size: portfolioSize,
            portfolio_types: portfolioTypes,
          },
          { onConflict: "user_id" },
        );
        // First property
        const cleanAddress = sanitize(address);
        if (cleanAddress) {
          await supabase.from("properties").insert({
            owner_id: user.id,
            address_line1: cleanAddress,
            property_type: propertyType || "house",
            bedrooms,
            monthly_rent: monthlyRent,
            status: "let",
          });
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
    <button
      type="button"
      onClick={props.onSkip}
      className="w-full text-center font-body text-sm text-neutral-400 hover:text-neutral-600"
    >
      Skip for now
    </button>
  );

  const DOC_LABELS: Record<DocType, string> = {
    gas_safety: "Gas Safety Certificate",
    epc: "Energy Performance Certificate (EPC)",
    eicr: "Electrical Installation Condition Report (EICR)",
  };

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={step}
      title={
        [
          "Tell us about your portfolio",
          "Your first property",
          "Compliance documents",
        ][step]
      }
      subtitle="We'll use this to personalise your dashboard."
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelect}
      />

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>How many properties do you manage?</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPortfolioSize(Math.max(1, portfolioSize - 1))}
                className="flex size-10 items-center justify-center rounded-full border-2 border-neutral-300 text-lg font-medium"
              >
                -
              </button>
              <span className="w-12 text-center font-heading text-2xl font-bold text-neutral-900">
                {portfolioSize}
              </span>
              <button
                onClick={() => setPortfolioSize(portfolioSize + 1)}
                className="flex size-10 items-center justify-center rounded-full border-2 border-neutral-300 text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Property types</Label>
            <div className="flex flex-wrap gap-2">
              {PORTFOLIO_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors",
                    portfolioTypes.includes(type)
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-300 text-neutral-600 hover:border-brand-primary",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setStep(1)} className="w-full">
            Continue
          </Button>
          <SkipLink />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Property address</Label>
            <Input
              placeholder="e.g. 45 Park Lane, London, W1K 1PN"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Property type</Label>
            <div className="grid grid-cols-3 gap-2">
              {["Flat", "House", "HMO"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPropertyType(t)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors",
                    propertyType === t
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-neutral-200 text-neutral-700",
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
                  onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
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
              <Label>Monthly rent</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  £
                </span>
                <Input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="h-11 pl-7"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              className="flex-1"
            >
              Back
            </Button>
            <Button onClick={() => setStep(2)} className="flex-1">
              Continue
            </Button>
          </div>
          <SkipLink />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="font-body text-sm text-neutral-500">
            Upload compliance documents to stay on top of your obligations. All
            optional — you can add them later.
          </p>
          {(["gas_safety", "epc", "eicr"] as DocType[]).map((docType) => {
            const uploaded = uploadedDocs.find((d) => d.type === docType);
            return (
              <div
                key={docType}
                className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {DOC_LABELS[docType]}
                  </p>
                  {uploaded && (
                    <p className="text-xs text-neutral-400">{uploaded.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploaded ? (
                    <button
                      onClick={() =>
                        setUploadedDocs((d) =>
                          d.filter((x) => x.type !== docType),
                        )
                      }
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerUpload(docType)}
                      className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                    >
                      <Upload className="size-3" />
                      Upload
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Saving…" : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
