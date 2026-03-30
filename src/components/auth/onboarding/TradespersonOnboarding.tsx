"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingLayout } from "@/components/auth/OnboardingLayout";
import { createClient } from "@/lib/supabase/client";
import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  Plus,
  MapPin,
  Shield,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Wrench,
  Zap,
  Hammer,
  Ruler,
  ClipboardList,
  Flame,
  PaintRoller,
  HardHat,
  Home,
  PaintBucket,
} from "lucide-react";

const STEPS = ["Services", "Coverage Area", "Credentials", "Portfolio & Bio"];

const TRADE_CATEGORIES: { label: string; icon: React.ReactNode }[] = [
  { label: "Plumber", icon: <Wrench className="size-6" aria-hidden="true" /> },
  { label: "Electrician", icon: <Zap className="size-6" aria-hidden="true" /> },
  { label: "Carpenter", icon: <Hammer className="size-6" aria-hidden="true" /> },
  { label: "Surveyor", icon: <Ruler className="size-6" aria-hidden="true" /> },
  { label: "Conveyancer", icon: <ClipboardList className="size-6" aria-hidden="true" /> },
  { label: "Gas Engineer", icon: <Flame className="size-6" aria-hidden="true" /> },
  { label: "Painter & Decorator", icon: <PaintRoller className="size-6" aria-hidden="true" /> },
  { label: "Builder", icon: <HardHat className="size-6" aria-hidden="true" /> },
  { label: "Roofer", icon: <Home className="size-6" aria-hidden="true" /> },
  { label: "Plasterer", icon: <PaintBucket className="size-6" aria-hidden="true" /> },
];

const ACCREDITATIONS = [
  "Gas Safe",
  "NICEIC",
  "NAPIT",
  "CHAS",
  "TrustMark",
  "Which? Trusted Trader",
];

const COVERAGE_RADII = [5, 10, 15, 25, 50];

type CredType = "gas_safe" | "insurance" | "qualification";
type UploadedCred = { type: CredType; name: string };
type PortfolioImage = { id: string; name: string };

export function TradespersonOnboarding(
  props: Readonly<{
    onComplete: () => void;
    onSkip: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Services
  const [tradeCategories, setTradeCategories] = useState<string[]>([]);

  // Step 2 — Coverage
  const [basePostcode, setBasePostcode] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);

  // Step 3 — Credentials
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [accreditations, setAccreditations] = useState<string[]>([]);
  const [uploadedCreds, setUploadedCreds] = useState<UploadedCred[]>([]);
  const credInputRef = useRef<HTMLInputElement>(null);
  const [pendingCredType, setPendingCredType] = useState<CredType | null>(null);

  // Step 4 — Portfolio & Bio
  const [bio, setBio] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const requiresGasSafe = tradeCategories.includes("Gas Engineer");

  useEffect(() => {
    if (
      tradeCategories.includes("Gas Engineer") &&
      !accreditations.includes("Gas Safe")
    ) {
      setAccreditations((prev) => [...prev, "Gas Safe"]);
    }
  }, [tradeCategories, accreditations]);

  function toggle<T extends string>(
    items: T[],
    item: T,
    setter: (v: T[]) => void,
  ) {
    setter(
      items.includes(item)
        ? items.filter((i) => i !== item)
        : [...items, item],
    );
  }

  function triggerCredUpload(credType: CredType) {
    setPendingCredType(credType);
    credInputRef.current?.click();
  }

  function handleCredSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && pendingCredType) {
      setUploadedCreds((prev) => [
        ...prev.filter((c) => c.type !== pendingCredType),
        { type: pendingCredType, name: file.name },
      ]);
    }
    setPendingCredType(null);
    if (credInputRef.current) credInputRef.current.value = "";
  }

  function handlePortfolioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newImages: PortfolioImage[] = files.slice(0, 20 - portfolioImages.length).map(
      (f) => ({ id: crypto.randomUUID(), name: f.name }),
    );
    setPortfolioImages((prev) => [...prev, ...newImages]);
    if (portfolioInputRef.current) portfolioInputRef.current.value = "";
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("service_provider_profiles").upsert(
          {
            user_id: user.id,
            trade_categories: tradeCategories,
            insurance_policy_number: sanitize(insuranceNumber),
            accreditations,
            bio: sanitize(bio),
          },
          { onConflict: "user_id" },
        );
        if (coverageAreas.length > 0) {
          await supabase.from("provider_service_areas").upsert(
            coverageAreas.map((area) => ({ user_id: user.id, area })),
            { onConflict: "user_id,area" },
          );
        }
        // Also store postcode + radius if provided
        if (basePostcode) {
          await supabase.from("provider_service_areas").upsert(
            [{ user_id: user.id, area: basePostcode, radius_miles: radiusMiles }],
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
    <button
      type="button"
      onClick={props.onSkip}
      aria-label="Skip onboarding for now"
      className="w-full text-center font-sans text-sm text-neutral-400 transition-colors hover:text-neutral-600"
    >
      Skip for now
    </button>
  );

  const CRED_CONFIG: {
    type: CredType;
    label: string;
    hint: string;
    required?: boolean;
  }[] = [
    {
      type: "gas_safe",
      label: "Gas Safe Registration",
      hint: requiresGasSafe
        ? "Legally required for Gas Engineers"
        : "Required if working with gas appliances",
      required: requiresGasSafe,
    },
    {
      type: "insurance",
      label: "Public Liability Insurance",
      hint: "Minimum £1M coverage — PDF, JPG or PNG up to 10MB",
    },
    {
      type: "qualification",
      label: "Trade Qualification",
      hint: "e.g. NVQ Level 3, City & Guilds — optional",
    },
  ];

  const titles = [
    "What services do you offer?",
    "Where do you work?",
    "Your credentials",
    "Portfolio & bio",
  ];

  const subtitles = [
    "Select all trades and services you offer to clients.",
    "Define your service area so clients nearby can find you.",
    "Verified credentials build trust and win more jobs.",
    "Showcase your best work and tell clients about yourself.",
  ];

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={step}
      title={titles[step]}
      subtitle={subtitles[step]}
    >
      {/* Hidden file inputs */}
      <input
        ref={credInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleCredSelect}
        aria-hidden="true"
      />
      <input
        ref={portfolioInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handlePortfolioSelect}
        aria-hidden="true"
      />

      {/* ─── Step 1: Services ───────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TRADE_CATEGORIES.map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                aria-pressed={tradeCategories.includes(label)}
                aria-label={`Toggle trade: ${label}`}
                onClick={() =>
                  toggle(tradeCategories, label, setTradeCategories)
                }
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all",
                  tradeCategories.includes(label)
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary/50 hover:text-brand-primary",
                )}
              >
                {icon}
                <span className="font-sans text-xs font-medium leading-tight">
                  {label}
                </span>
                {tradeCategories.includes(label) && (
                  <CheckCircle2
                    className="size-3.5 text-brand-primary"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>

          {tradeCategories.length > 0 && (
            <p className="font-sans text-xs text-neutral-500">
              {tradeCategories.length} service
              {tradeCategories.length !== 1 ? "s" : ""} selected
            </p>
          )}

          <Button
            onClick={() => setStep(1)}
            disabled={tradeCategories.length === 0}
            aria-label="Continue to coverage area step"
            className="w-full h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light disabled:opacity-60"
          >
            Continue
          </Button>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 2: Coverage Area ──────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Postcode input */}
          <div className="space-y-2">
            <Label
              htmlFor="base-postcode"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Base postcode
            </Label>
            <div className="relative">
              <MapPin
                className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                id="base-postcode"
                type="text"
                placeholder="e.g. SW1A 2AA"
                value={basePostcode}
                onChange={(e) =>
                  setBasePostcode(e.target.value.toUpperCase())
                }
                aria-label="Base postcode"
                className="h-11 w-full rounded-xl border-2 border-neutral-200 bg-white py-2 pl-10 pr-4 font-sans text-sm text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Radius selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-sans text-sm font-medium text-neutral-700">
                Service radius
              </Label>
              <span className="rounded-full bg-brand-primary px-3 py-0.5 font-sans text-xs font-semibold text-white">
                {radiusMiles} miles
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              aria-label={`Service radius: ${radiusMiles} miles`}
              className="w-full accent-brand-primary"
            />
            <div className="flex justify-between">
              {COVERAGE_RADII.map((r) => (
                <span key={r} className="font-sans text-xs text-neutral-400">
                  {r}mi
                </span>
              ))}
            </div>
          </div>

          {/* Coverage preview */}
          {basePostcode.length >= 3 && (
            <div className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3">
              <MapPin
                className="size-4 shrink-0 text-brand-primary"
                aria-hidden="true"
              />
              <p className="font-sans text-sm text-brand-primary">
                Covering approximately{" "}
                <strong>{radiusMiles}-mile radius</strong> from{" "}
                {basePostcode}
              </p>
            </div>
          )}

          {/* Optional: also add named regions */}
          <div className="space-y-2">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Additional named areas{" "}
              <span className="text-xs font-normal text-neutral-400">
                (optional)
              </span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "London",
                "South East",
                "East of England",
                "South West",
                "West Midlands",
                "East Midlands",
                "Yorkshire",
                "North West",
                "North East",
                "Wales",
                "Scotland",
              ].map((region) => (
                <button
                  key={region}
                  type="button"
                  aria-pressed={coverageAreas.includes(region)}
                  aria-label={`Toggle coverage area: ${region}`}
                  onClick={() =>
                    toggle(coverageAreas, region, setCoverageAreas)
                  }
                  className={cn(
                    "rounded-full border-2 px-3 py-1 font-sans text-xs font-medium transition-all",
                    coverageAreas.includes(region)
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              aria-label="Go back to services step"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              aria-label="Continue to credentials step"
              className="flex-1 h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light"
            >
              Continue
            </Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 3: Credentials ────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Insurance policy number */}
          <div className="space-y-2">
            <Label
              htmlFor="insurance-number"
              className="font-sans text-sm font-medium text-neutral-700"
            >
              Insurance policy number{" "}
              <span className="text-xs font-normal text-neutral-400">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Shield
                className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <Input
                id="insurance-number"
                placeholder="e.g. POL-12345678"
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                aria-label="Insurance policy number"
                className="h-11 rounded-xl border-2 border-neutral-200 pl-10 text-sm focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Accreditations */}
          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Accreditations
            </Label>
            <div className="flex flex-wrap gap-2">
              {ACCREDITATIONS.map((acc) => {
                const isRequired = requiresGasSafe && acc === "Gas Safe";
                return (
                  <button
                    key={acc}
                    type="button"
                    aria-pressed={accreditations.includes(acc)}
                    aria-label={`${isRequired ? "Required: " : "Toggle accreditation: "}${acc}`}
                    onClick={() => {
                      if (isRequired) return;
                      toggle(accreditations, acc, setAccreditations);
                    }}
                    className={cn(
                      "rounded-full border-2 px-3.5 py-1.5 font-sans text-sm font-medium transition-all",
                      accreditations.includes(acc)
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-primary hover:text-brand-primary",
                      isRequired && "cursor-not-allowed opacity-90",
                    )}
                  >
                    {acc}
                    {isRequired && " ✓"}
                  </button>
                );
              })}
            </div>
            {requiresGasSafe && (
              <p className="font-sans text-xs text-brand-secondary">
                Gas Safe registration is legally required for Gas Engineers.
              </p>
            )}
          </div>

          {/* Document upload cards */}
          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium text-neutral-700">
              Supporting documents
            </Label>
            {CRED_CONFIG.map(({ type, label, hint, required }) => {
              const uploaded = uploadedCreds.find((c) => c.type === type);
              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-start justify-between rounded-xl border-2 p-4 transition-all",
                    uploaded
                      ? "border-brand-primary bg-brand-primary/5"
                      : required && requiresGasSafe && type === "gas_safe"
                        ? "border-brand-secondary bg-brand-secondary-light"
                        : "border-neutral-200 bg-white",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      <FileText
                        className="size-4 text-neutral-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-semibold text-neutral-900">
                        {label}
                        {required && (
                          <span className="ml-1.5 rounded-full bg-brand-secondary/20 px-2 py-0.5 font-sans text-xs font-medium text-brand-secondary">
                            Required
                          </span>
                        )}
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
                          setUploadedCreds((c) =>
                            c.filter((x) => x.type !== type),
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
                        onClick={() => triggerCredUpload(type)}
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
            <p className="font-sans text-xs text-neutral-400">
              Files are securely encrypted and GDPR compliant.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              aria-label="Go back to coverage area step"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              aria-label="Continue to portfolio and bio step"
              disabled={
                requiresGasSafe && !accreditations.includes("Gas Safe")
              }
              className="flex-1 h-11 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary-light disabled:opacity-60"
            >
              Continue
            </Button>
          </div>
          <SkipLink />
        </div>
      )}

      {/* ─── Step 4: Portfolio & Bio ────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Bio textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="provider-bio"
                className="font-sans text-sm font-medium text-neutral-700"
              >
                Professional bio{" "}
                <span className="text-xs font-normal text-neutral-400">
                  (optional)
                </span>
              </Label>
              <span className="font-sans text-xs text-neutral-400">
                {bio.length}/1500
              </span>
            </div>
            <textarea
              id="provider-bio"
              placeholder="Tell clients about your experience, expertise and the quality of your work…"
              value={bio}
              onChange={(e) =>
                setBio(e.target.value.slice(0, 1500))
              }
              rows={4}
              aria-label="Professional bio"
              className="w-full resize-none rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 font-sans text-sm text-neutral-900 outline-none placeholder:text-neutral-400 transition-colors focus:border-brand-primary"
            />
          </div>

          {/* Portfolio photos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-sans text-sm font-medium text-neutral-700">
                Portfolio photos{" "}
                <span className="text-xs font-normal text-neutral-400">
                  (optional)
                </span>
              </Label>
              <span className="font-sans text-xs text-neutral-400">
                {portfolioImages.length}/20
              </span>
            </div>

            {/* Tip */}
            <div className="flex items-start gap-2 rounded-xl border border-brand-accent/20 bg-brand-accent-light px-4 py-3">
              <ImageIcon
                className="mt-0.5 size-4 shrink-0 text-brand-accent"
                aria-hidden="true"
              />
              <p className="font-sans text-xs text-brand-accent">
                Profiles with before &amp; after photos receive{" "}
                <strong>40% more booking requests</strong> on average.
              </p>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {portfolioImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-xl border-2 border-neutral-200 bg-neutral-50 overflow-hidden"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-1 p-2">
                    <ImageIcon
                      className="size-5 text-neutral-400"
                      aria-hidden="true"
                    />
                    <p className="truncate w-full text-center font-sans text-xs text-neutral-500">
                      {img.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove photo ${img.name}`}
                    onClick={() =>
                      setPortfolioImages((prev) =>
                        prev.filter((p) => p.id !== img.id),
                      )
                    }
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-white shadow-sm text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-700"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {/* Add photo button */}
              {portfolioImages.length < 20 && (
                <button
                  type="button"
                  aria-label="Add portfolio photo"
                  onClick={() => portfolioInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 transition-all hover:border-brand-primary hover:bg-brand-primary/5 flex flex-col items-center justify-center gap-1"
                >
                  <Plus
                    className="size-5 text-neutral-400"
                    aria-hidden="true"
                  />
                  <span className="font-sans text-xs text-neutral-400">
                    Add photo
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              aria-label="Go back to credentials step"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-200 font-semibold text-neutral-700 hover:border-neutral-300"
            >
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={saving}
              aria-label={saving ? "Saving your profile" : "Complete provider setup"}
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
