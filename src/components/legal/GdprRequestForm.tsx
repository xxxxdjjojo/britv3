"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const RIGHT_TYPES = [
  "Access",
  "Erasure",
  "Portability",
  "Rectification",
  "Restriction",
  "Objection",
  "Withdraw Consent",
  "Lodge Complaint",
] as const;

type RightType = (typeof RIGHT_TYPES)[number];

type SuccessState = { reference: string };

export function GdprRequestForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [rightType, setRightType] = useState<RightType | "">("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate-limited">("idle");
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const res = await fetch("/api/legal/gdpr-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, accountEmail: accountEmail || undefined, rightType, description }),
    });

    const data = await res.json();

    if (res.status === 429) {
      setStatus("rate-limited");
      return;
    }

    if (!res.ok || !data.success) {
      setStatus("error");
      setErrorMessage(data.error ?? "An unexpected error occurred. Please try again.");
      return;
    }

    setSuccess({ reference: data.reference });
    setStatus("success");
  }

  if (status === "success" && success) {
    return (
      <div className="rounded-xl border border-success/20 bg-success-light p-6">
        <h3 className="font-semibold font-heading text-success mb-2">Request Received</h3>
        <p className="text-sm text-success mb-3">
          Your reference number is: <strong>{success.reference}</strong>
        </p>
        <p className="text-sm text-success">
          We will respond within 30 days. If your request is complex, we may extend by up to 2 months
          and will notify you. You have the right to{" "}
          <a
            href="https://ico.org.uk/make-a-complaint"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            complain to the ICO
          </a>{" "}
          if you&apos;re unsatisfied.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="gdpr-full-name" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Full Name <span className="text-error">*</span>
        </label>
        <input
          id="gdpr-full-name"
          type="text"
          required
          minLength={2}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="gdpr-email" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Email Address <span className="text-error">*</span>
        </label>
        <input
          id="gdpr-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="gdpr-account-email" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Account Email (if different)
        </label>
        <input
          id="gdpr-account-email"
          type="email"
          value={accountEmail}
          onChange={(e) => setAccountEmail(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="gdpr-right-type" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Right Type <span className="text-error">*</span>
        </label>
        <select
          id="gdpr-right-type"
          required
          value={rightType}
          onChange={(e) => setRightType(e.target.value as RightType)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 bg-white"
        >
          <option value="">Select a right&hellip;</option>
          {RIGHT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="gdpr-description" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Description <span className="text-error">*</span>
        </label>
        <textarea
          id="gdpr-description"
          required
          minLength={20}
          maxLength={1000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none"
          placeholder="Please describe your request in detail (min. 20 characters)&hellip;"
        />
        <p className="mt-1 text-xs text-neutral-500 text-right">{description.length}/1000</p>
      </div>

      {status === "rate-limited" && (
        <p className="rounded-lg bg-warning-light border border-warning/20 text-warning px-4 py-3 text-sm">
          You have already submitted a request recently. Please wait before submitting again.
        </p>
      )}

      {status === "error" && (
        <p className="rounded-lg bg-error-light border border-error/10 text-error px-4 py-3 text-sm">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
        Submit Request
      </button>
    </form>
  );
}
