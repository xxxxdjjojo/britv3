"use client";

/**
 * QuoteModal — Client Component
 *
 * A 3-step "Request for Quote" modal for a tradesperson public profile page.
 *
 * Step 1 — Job Details: service type, preferred date, budget, timeline, description
 * Step 2 — Contact Details: name, email, phone
 * Step 3 — Confirmation: success screen
 *
 * On submit, inserts a row into the provider_leads Supabase table using the
 * browser client (anon RLS policy allows inserts from public users).
 */

import { useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuoteModalProps = Readonly<{
  providerId: string;
  providerName: string;
  services: string[];
  open: boolean;
  initialService?: string;
  onOpenChange: (open: boolean) => void;
}>;

type FormData = {
  serviceType: string;
  preferredDate: string;
  budget: string;
  timeline: string;
  description: string;
  name: string;
  email: string;
  phone: string;
};

const BUDGET_OPTIONS = [
  "Under £200",
  "£200 – £500",
  "£500 – £1,000",
  "£1,000 – £5,000",
  "£5,000+",
];

const TIMELINE_OPTIONS = ["ASAP", "This week", "This month", "Flexible"];

export function QuoteModal({
  providerId,
  providerName,
  services,
  open,
  initialService = "",
  onOpenChange,
}: QuoteModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    serviceType: initialService,
    preferredDate: "",
    budget: "",
    timeline: "",
    description: "",
    name: "",
    email: "",
    phone: "",
  });

  // Sync initialService into form when it changes (e.g. clicking different service card)
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        // Reset state on close
        setTimeout(() => {
          setStep(1);
          setSubmitError(null);
          setFormData({
            serviceType: "",
            preferredDate: "",
            budget: "",
            timeline: "",
            description: "",
            name: "",
            email: "",
            phone: "",
          });
        }, 300);
      } else {
        setFormData((prev) => ({ ...prev, serviceType: initialService }));
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, initialService],
  );

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // Validation for step 1
  const step1Valid =
    formData.budget.trim() !== "" &&
    formData.timeline.trim() !== "" &&
    formData.description.trim().length >= 20;

  // Validation for step 2
  const step2Valid =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

  async function handleSubmit() {
    if (!step2Valid) return;
    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();
    const { error } = await supabase.from("provider_leads").insert({
      provider_id: providerId,
      contact_name: formData.name.trim(),
      contact_email: formData.email.trim(),
      contact_phone: formData.phone.trim() || null,
      service_type: formData.serviceType || null,
      preferred_date: formData.preferredDate || null,
      description: formData.description.trim(),
      source: "profile_page",
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(
        "Something went wrong submitting your request. Please try again.",
      );
      return;
    }

    setStep(3);
  }

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
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Service type */}
              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Service type
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => updateField("serviceType", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="">Select a service...</option>
                    {services.map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preferred date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred date (optional)
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => updateField("preferredDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Budget range <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => updateField("budget", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Timeline <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => updateField("timeline", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Describe the work needed{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder="Please describe what you need done (minimum 20 characters)..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                  required
                  minLength={20}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {formData.description.length}/20 characters minimum
                </p>
              </div>

              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="w-full bg-[#2563EB] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next &rarr;
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Contact Details */}
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone number (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+44 7700 000000"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  autoComplete="tel"
                />
              </div>

              {/* Privacy note */}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We&apos;ll only share your details with {providerName}.
              </p>

              {/* Submit error */}
              {submitError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {submitError}
                  </p>
                </div>
              )}

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
                  className="flex-1 bg-[#2563EB] text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Submit Request \u2192"}
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
                Request Sent!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                We&apos;ll connect you with {providerName} within 24 hours.
                Check your email for confirmation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
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
