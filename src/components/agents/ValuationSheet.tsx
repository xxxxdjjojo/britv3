"use client";

/**
 * ValuationSheet — Client Component
 *
 * A Shadcn Sheet (slide-in from right) that collects property details
 * and contact information for a free valuation request. On submission it
 * inserts a row into the agent_leads table with stage='new_enquiry'.
 *
 * Export pattern:
 *   - ValuationSheet   — self-contained Sheet (trigger + panel)
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Props = Readonly<{
  agencyId: string;
  agencyName: string;
}>;

type FormData = {
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms: string;
  tenure: string;
  contactTime: string;
  name: string;
  phone: string;
  email: string;
};

const DEFAULT_FORM: FormData = {
  address: "",
  postcode: "",
  propertyType: "",
  bedrooms: "",
  tenure: "",
  contactTime: "",
  name: "",
  phone: "",
  email: "",
};

export function ValuationSheet({ agencyId, agencyName }: Props) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    const { error: insertError } = await supabase.from("agent_leads").insert({
      agency_id: agencyId,
      stage: "new_enquiry",
      source: "valuation_request",
      contact_name: formData.name,
      contact_email: formData.email,
      contact_phone: formData.phone,
      property_address: formData.address,
      property_postcode: formData.postcode,
      property_type: formData.propertyType,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms, 10) : null,
      notes: `Tenure: ${formData.tenure}. Preferred contact: ${formData.contactTime}.`,
    });

    setSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  function handleClose() {
    setOpen(false);
    // Reset form after sheet closes
    setTimeout(() => {
      setFormData(DEFAULT_FORM);
      setSuccess(false);
      setError(null);
    }, 300);
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#f4f3f2] dark:bg-[#1a2822] text-[#1a1a1a] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30 focus:border-[#1B4D3E]";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#163d31] active:bg-[#0f2b22] transition-colors"
      >
        Request a Free Valuation
      </button>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>Request a Free Valuation</SheetTitle>
          <SheetDescription>
            Get an expert valuation from {agencyName}
          </SheetDescription>
        </SheetHeader>

        {success ? (
          /* Confirmation state */
          <div className="flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-white mb-2">
                Request Submitted!
              </h3>
              <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm">
                Thank you! We&apos;ll be in touch within 24 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 min-h-[44px] rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#163d31] active:bg-[#0f2b22] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Property address */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Property Address <span className="text-red-500">*</span>
              </label>
              <input
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 42 Maple Street"
                className={inputClass}
              />
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Postcode
              </label>
              <input
                name="postcode"
                type="text"
                value={formData.postcode}
                onChange={handleChange}
                placeholder="e.g. SW1A 1AA"
                className={inputClass}
              />
            </div>

            {/* Property type */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Property Type
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select type</option>
                <option value="detached">Detached</option>
                <option value="semi_detached">Semi-Detached</option>
                <option value="terraced">Terraced</option>
                <option value="flat_apartment">Flat/Apartment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Bedrooms
              </label>
              <select
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select bedrooms</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Tenure */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Tenure
              </label>
              <select
                name="tenure"
                value={formData.tenure}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select tenure</option>
                <option value="freehold">Freehold</option>
                <option value="leasehold">Leasehold</option>
                <option value="share_of_freehold">Share of Freehold</option>
              </select>
            </div>

            {/* Preferred contact time */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Preferred Contact Time
              </label>
              <select
                name="contactTime"
                value={formData.contactTime}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select time</option>
                <option value="morning">Morning (9–12)</option>
                <option value="afternoon">Afternoon (12–17)</option>
                <option value="evening">Evening (17–20)</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>

            <hr className="border-[#e8e6e3] dark:border-[#243330]" />

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 07700 900123"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Inline error */}
            {error && (
              <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#163d31] active:bg-[#0f2b22] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting…" : "Request Valuation"}
            </button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
