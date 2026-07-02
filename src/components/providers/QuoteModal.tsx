"use client";

/**
 * QuoteModal — Client Component
 *
 * A multi-step "Request for Quote" modal for a tradesperson public profile
 * page. Submits a TARGETED RFQ into the unified pipeline via
 * POST /api/rfq/create (visible only to this provider).
 *
 * Step 1 — Job Details: category, postcode, preferred date, budget, timeline,
 *          description. Logged-in users submit directly from here.
 * Step 2 — Contact Details (guests only): name, email, phone + honeypot
 * Step 3 — Confirmation: success screen (copy split by auth state)
 */

import { useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuoteModalProps = Readonly<{
  /** service_provider_details.user_id — the targeted provider */
  providerUserId: string;
  providerName: string;
  /** Raw service category enum values, e.g. "plumber" */
  categories: string[];
  source?: string;
  open: boolean;
  /**
   * The provider's CUSTOM service display name (provider_services.name, NOT a
   * category enum value) — used verbatim in the generated RFQ title.
   */
  initialService?: string;
  onOpenChange: (open: boolean) => void;
}>;

type FormData = {
  serviceCategory: string;
  postcode: string;
  preferredDate: string;
  budget: string;
  timeline: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  /** Honeypot — real users never fill this. */
  company: string;
};

const EMPTY_FORM: FormData = {
  serviceCategory: "",
  postcode: "",
  preferredDate: "",
  budget: "",
  timeline: "",
  description: "",
  name: "",
  email: "",
  phone: "",
  company: "",
};

const BUDGET_OPTIONS = [
  "Under £200",
  "£200 – £500",
  "£500 – £1,000",
  "£1,000 – £5,000",
  "£5,000+",
];

const TIMELINE_OPTIONS = ["ASAP", "This week", "This month", "Flexible"];

const BUDGET_BAND_VALUES: Record<string, { min?: number; max?: number }> = {
  "Under £200": { max: 200 },
  "£200 – £500": { min: 200, max: 500 },
  "£500 – £1,000": { min: 500, max: 1000 },
  "£1,000 – £5,000": { min: 1000, max: 5000 },
  "£5,000+": { min: 5000 },
};

const TIMELINE_TO_URGENCY: Record<string, "low" | "normal" | "high"> = {
  ASAP: "high",
  "This week": "normal",
  "This month": "normal",
  Flexible: "low",
};

const DESCRIPTION_MIN = 50;

// Mirrors UK_POSTCODE_REGEX in src/lib/validators/marketplace-schemas.ts
// (not exported there).
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;

const humanise = (c: string) =>
  c.replace(/_/g, " ").replace(/^\w/, (m) => m.toUpperCase());

export function QuoteModal({
  providerUserId,
  providerName,
  categories,
  source = "trader_profile_modal",
  open,
  initialService = "",
  onOpenChange,
}: QuoteModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Spec §A: the category select is preselected from the trader's services.
  const defaultCategory = categories[0] ?? "";
  const [formData, setFormData] = useState<FormData>({
    ...EMPTY_FORM,
    serviceCategory: defaultCategory,
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset state on close
        setTimeout(() => {
          setStep(1);
          setSubmitError(null);
          setFormData({ ...EMPTY_FORM, serviceCategory: defaultCategory });
        }, 300);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, defaultCategory],
  );

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // Validation for step 1
  const step1Valid =
    UK_POSTCODE_REGEX.test(formData.postcode.trim()) &&
    formData.budget.trim() !== "" &&
    formData.timeline.trim() !== "" &&
    formData.description.trim().length >= DESCRIPTION_MIN;

  // Validation for step 2 (guests only)
  const step2Valid =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    const category = formData.serviceCategory || defaultCategory || "other";
    // initialService is a custom display name, not an enum — never matched
    // against category values, only used verbatim in the generated title.
    const titleSubject = initialService.trim() || humanise(category);

    const payload = {
      service_category: category,
      title: `${titleSubject} needed in ${formData.postcode.trim().toUpperCase()}`,
      description: formData.description.trim(),
      property_postcode: formData.postcode.trim(),
      preferred_start_date: formData.preferredDate || undefined,
      urgency_level: TIMELINE_TO_URGENCY[formData.timeline] ?? "normal",
      budget_min: BUDGET_BAND_VALUES[formData.budget]?.min,
      budget_max: BUDGET_BAND_VALUES[formData.budget]?.max,
      target_provider_id: providerUserId,
      source,
      ...(user
        ? {}
        : {
            contact_name: formData.name.trim(),
            contact_email: formData.email.trim(),
            contact_phone: formData.phone.trim() || undefined,
            company: formData.company, // honeypot passthrough
          }),
    };

    try {
      const res = await fetch("/api/rfq/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Something went wrong submitting your request. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // keep generic message
        }
        setSubmitError(message);
        return;
      }

      setStep(3);
    } catch {
      setSubmitError(
        "Something went wrong submitting your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleStepOneContinue() {
    if (!step1Valid) return;
    if (user) {
      void handleSubmit();
    } else {
      setSubmitError(null);
      setStep(2);
    }
  }

  const errorBlock = submitError && (
    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
      <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Step 1 — Job Details */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                What do you need help with?
              </DialogTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Request to {providerName}
              </p>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Service type */}
              {categories.length > 0 && (
                <div>
                  <label
                    htmlFor="quote-service-category"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Service type
                  </label>
                  <select
                    id="quote-service-category"
                    value={formData.serviceCategory}
                    onChange={(e) =>
                      updateField("serviceCategory", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">Select a service...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {humanise(cat)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Postcode */}
              <div>
                <label
                  htmlFor="quote-postcode"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Postcode <span className="text-red-500">*</span>
                </label>
                <input
                  id="quote-postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => updateField("postcode", e.target.value)}
                  placeholder="e.g. SW1A 1AA"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                  autoComplete="postal-code"
                />
              </div>

              {/* Preferred date */}
              <div>
                <label
                  htmlFor="quote-preferred-date"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Preferred date (optional)
                </label>
                <input
                  id="quote-preferred-date"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => updateField("preferredDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Budget */}
              <div>
                <label
                  htmlFor="quote-budget"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Budget range <span className="text-red-500">*</span>
                </label>
                <select
                  id="quote-budget"
                  value={formData.budget}
                  onChange={(e) => updateField("budget", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                >
                  <option value="">Select budget...</option>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeline */}
              <div>
                <label
                  htmlFor="quote-timeline"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Timeline <span className="text-red-500">*</span>
                </label>
                <select
                  id="quote-timeline"
                  value={formData.timeline}
                  onChange={(e) => updateField("timeline", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                >
                  <option value="">When do you need this done?</option>
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="quote-description"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Describe the work needed{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="quote-description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder={`Please describe what you need done (minimum ${DESCRIPTION_MIN} characters)...`}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  required
                  minLength={DESCRIPTION_MIN}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {formData.description.length}/{DESCRIPTION_MIN} characters
                  minimum
                </p>
              </div>

              {/* Submit error (logged-in users submit from this step) */}
              {errorBlock}

              <button
                type="button"
                disabled={!step1Valid || submitting}
                onClick={handleStepOneContinue}
                className="w-full bg-brand-primary text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user
                  ? submitting
                    ? "Sending..."
                    : "Submit Request →"
                  : "Next →"}
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Contact Details (guests only) */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                How should {providerName} reach you?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Name */}
              <div>
                <label
                  htmlFor="quote-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="quote-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="quote-email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="quote-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="quote-phone"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Phone number (optional)
                </label>
                <input
                  id="quote-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+44 7700 000000"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  autoComplete="tel"
                />
              </div>

              {/* Honeypot — hidden from real users, bots fill it */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="quote-company">Company</label>
                <input
                  id="quote-company"
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Privacy note */}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We&apos;ll only share your details with {providerName}.
              </p>

              {/* Submit error */}
              {errorBlock}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-lg font-semibold hover:bg-surface dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  disabled={!step2Valid || submitting}
                  onClick={handleSubmit}
                  className="flex-1 bg-brand-primary text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Submit Request →"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-brand-primary mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Request sent to {providerName}
              </h2>
              {user ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {providerName} has been notified of your request.{" "}
                  <Link
                    href="/dashboard/rfqs"
                    className="text-brand-primary font-semibold underline underline-offset-2"
                  >
                    Track it in your dashboard
                  </Link>
                  .
                </p>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {providerName} has been notified of your request. Any quotes
                  will be sent to {formData.email.trim() || "your email"}.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="bg-brand-primary text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-emerald-800 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
