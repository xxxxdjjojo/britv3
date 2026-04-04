"use client";

import { useState } from "react";

type RefereeSubmissionFormProps = Readonly<{
  referenceId: string;
  token: string;
  refereeName: string;
  providerName: string;
  referenceType: "client" | "peer";
}>;

export function RefereeSubmissionForm({
  token,
  refereeName,
  providerName,
  referenceType,
}: RefereeSubmissionFormProps) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isValid = text.length >= 50 && rating >= 1 && consent;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reference/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          reference_text: text,
          rating,
          gdpr_consent: consent,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
          <span className="text-3xl text-success">&#10003;</span>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">
          Thank You!
        </h1>
        <p className="text-sm text-neutral-600">
          Your reference for {providerName} has been submitted successfully. It
          will help verify their professional credentials on Britestate.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Reference for {providerName}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          As a {referenceType === "peer" ? "professional peer" : "client"}, your
          honest feedback helps build trust in the Britestate marketplace.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-light px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Referee Name (read-only) */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Your Name
        </label>
        <input
          type="text"
          value={refereeName}
          readOnly
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
        />
      </div>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Overall Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-3xl transition-colors hover:scale-110"
              aria-label={`Rate ${star} out of 5`}
            >
              <span className={star <= rating ? "text-warning" : "text-neutral-300"}>
                {star <= rating ? "\u2605" : "\u2606"}
              </span>
            </button>
          ))}
        </div>
        {rating === 0 && (
          <p className="mt-1 text-xs text-neutral-500">Please select a rating</p>
        )}
      </div>

      {/* Reference Text */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Your Reference
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Describe your experience working with ${providerName}...`}
          rows={6}
          maxLength={2000}
          className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
        <p className={`mt-1 text-xs ${text.length >= 50 ? "text-success" : "text-neutral-500"}`}>
          {text.length} / 50 minimum characters
        </p>
      </div>

      {/* GDPR Consent */}
      <div className="mb-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-xs text-neutral-600">
            I consent to this reference being shared publicly on Britestate to
            verify {providerName}&apos;s professional credentials.
          </span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Reference"}
      </button>
    </div>
  );
}
