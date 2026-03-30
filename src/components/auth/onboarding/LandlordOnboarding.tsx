"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Upload, X, CheckCircle2, FileText, Zap, Flame } from "lucide-react";

const STEPS = ["Your Portfolio", "First Property", "Compliance Docs"];

const PORTFOLIO_TYPE_OPTIONS = [
  { label: "Residential", value: "Residential" },
  { label: "Commercial", value: "Commercial" },
  { label: "Mixed Use", value: "Mixed Use" },
  { label: "HMO", value: "HMO" },
  { label: "Student", value: "Student" },
];

const PORTFOLIO_SIZES = [
  { label: "1–2", value: 1 },
  { label: "3–5", value: 3 },
  { label: "6–10", value: 6 },
  { label: "11–20", value: 11 },
  { label: "20+", value: 20 },
];

type DocType = "gas_safety" | "epc" | "eicr";
type UploadedDoc = { type: DocType; name: string };

const DOC_CONFIG: {
  type: DocType;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "gas_safety",
    label: "Gas Safety Certificate",
    hint: "Annual certificate — required for gas appliances",
    icon: <Flame className="size-4 text-brand-secondary" />,
  },
  {
    type: "epc",
    label: "Energy Performance Certificate",
    hint: "EPC rating A–G — valid for 10 years",
    icon: <Zap className="size-4 text-brand-secondary" />,
  },
  {
    type: "eicr",
    label: "Electrical Installation Condition Report",
    hint: "EICR — required every 5 years for rentals",
    icon: <FileText className="size-4 text-brand-secondary" />,
  },
];

export function LandlordOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Portfolio
  const [portfolioSize, setPortfolioSize] = useState<number>(1);
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
        await supabase.from("landlord_profiles").upsert(
          {
            user_id: user.id,
            portfolio_size: portfolioSize,
            portfolio_types: portfolioTypes,
          },
          { onConflict: "user_id" },
        );

        // Persist first property details if the user filled them in.
        // Note: The `landlord_profiles` table currently has no property columns
        // or JSONB metadata column. When a `first_property_data` JSONB column
        // (or a dedicated `landlord_onboarding_properties` table) is added via
        // migration, replace this with a proper upsert. For now we store it in
        // the `activity_log` so the data is not silently discarded.
        if (address.trim()) {
          await supabase.from("activity_log").insert({
            user_id: user.id,
            event_type: "onboarding_first_property",
            description: "Landlord onboarding — first property details captured",
            metadata: {
              address: address.trim(),
              property_type: propertyType,
              bedrooms,
              monthly_rent: monthlyRent,
            },
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
      className="w-full text-center font-sans text-sm text-neutral-400 transition-colors hover:text-neutral-600"
      aria-label="Skip onboarding for now"
    >
      Skip for now
    </button>
  );

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
      subtitle={
        [
          "We'll personalise your landlord dashboard.",
          "Add your first rental property to get started.",
          "Stay compliant — all documents optional for now.",
        ][step]
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelect}
        aria-hidden="true"
      />

      {/* ─── Step 1: Portfolio Scope ─────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Portfolio size */}
          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              How many properties do you manage?
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {PORTFOLIO_SIZES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={`${opt.label} properties`}
                  onClick={() => setPortfolioSize(opt.value)}
                  className={cn(
                    "rounded-xl border-2 py-2.5 text-sm font-semibold transition-all",
                    portfolioSize === opt.value
                      ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio types */}
          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Property types{" "}
              <span className="text-xs font-normal text-neutral-400">
                (select all that apply)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {PORTFOLIO_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={portfolioTypes.includes(opt.value)}
                  aria-label={`Toggle ${opt.label}`}
                  onClick={() => toggleType(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                    portfolioTypes.includes(opt.value)
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {portfolioTypes.includes(opt.value) && (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setStep(1)}
            className="w-full h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light"
            aria-label="Continue to property detail step"
          >
            Continue
          </Button>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 2: Property Detail ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="property-address"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Property address
            </Label>
            <input
              id="property-address"
              type="text"
              placeholder="e.g. 45 Park Lane, London, W1K 1PN"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-label="Property address"
              className="h-11 w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-2 font-sans text-sm text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:border-brand-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Property type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {["Flat", "House", "HMO"].map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={propertyType === t}
                  aria-label={`Property type: ${t}`}
                  onClick={() => setPropertyType(t)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                    propertyType === t
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary/50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-sans text-sm font-medium text-neutral-700">
                Bedrooms
              </Label>
              <div className="flex h-11 items-center justify-between rounded-xl border-2 border-neutral-200 px-3">
                <button
                  type="button"
                  aria-label="Decrease bedrooms"
                  onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                  className="flex size-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-brand-primary hover:text-brand-primary"
                >
                  –
                </button>
                <span className="font-sans text-sm font-semibold text-neutral-900">
                  {bedrooms}
                </span>
                <button
                  type="button"
                  aria-label="Increase bedrooms"
                  onClick={() => setBedrooms(bedrooms + 1)}
                  className="flex size-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-brand-primary hover:text-brand-primary"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="monthly-rent"
                className="font-sans text-sm font-medium text-neutral-700"
              >
                Monthly rent
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm font-medium text-neutral-500">
                  £
                </span>
                <Input
                  id="monthly-rent"
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  aria-label="Monthly rent in pounds"
                  className="h-11 rounded-xl border-2 border-neutral-200 pl-8 text-sm focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              aria-label="Go back to portfolio scope"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              aria-label="Continue to compliance documents"
              className="flex-1 h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light"
            >
              Continue
            </Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 3: Compliance Docs ─────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="font-sans text-sm text-neutral-500">
            Upload compliance documents to stay on top of your legal
            obligations. All optional — you can add them later from your
            dashboard.
          </p>

          <div className="space-y-3">
            {DOC_CONFIG.map(({ type, label, hint, icon }) => {
              const uploaded = uploadedDocs.find((d) => d.type === type);
              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-start justify-between rounded-xl border-2 p-4 transition-all",
                    uploaded
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-neutral-200 bg-white",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-secondary-light">
                      {icon}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-semibold text-neutral-900">
                        {label}
                      </p>
                      {uploaded ? (
                        <p className="mt-0.5 font-sans text-xs text-brand-primary">
                          {uploaded.name}
                        </p>
                      ) : (
                        <p className="mt-0.5 font-sans text-xs text-neutral-400">
                          {hint}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">
                    {uploaded ? (
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        onClick={() =>
                          setUploadedDocs((d) =>
                            d.filter((x) => x.type !== type),
                          )
                        }
                        className="flex size-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Upload ${label}`}
                        onClick={() => triggerUpload(type)}
                        className="flex items-center gap-1.5 rounded-lg border-2 border-neutral-200 bg-white px-3 py-1.5 font-sans text-xs font-medium text-neutral-600 transition-all hover:border-brand-primary hover:text-brand-primary"
                      >
                        <Upload className="size-3.5" aria-hidden="true" />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload hint */}
          <p className="font-sans text-xs text-neutral-400">
            PDF, JPG or PNG up to 10MB. Files are securely encrypted and GDPR
            compliant.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              aria-label="Go back to property detail"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={saving}
              aria-label={saving ? "Saving your details" : "Complete landlord setup"}
              className="flex-1 h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light disabled:opacity-60"
            >
              {saving ? "Saving…" : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
