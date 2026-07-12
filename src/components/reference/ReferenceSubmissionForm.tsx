"use client";

/**
 * ReferenceSubmissionForm
 *
 * The interactive referee surface. Provider identity (name + trade) and the
 * referee's own name are READ-ONLY — they come from the server-resolved
 * invitation; the referee cannot change who they are vouching for.
 *
 * Two flows share this component:
 *  - submit  → POST /api/references/[token]/submit (body carries NO ids)
 *  - decline → POST /api/references/[token]/decline (optional reason)
 *
 * On success the form is swapped for a thank-you / declined confirmation.
 * HTTP status codes surface distinct, user-safe messages (409/410/400/429).
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck, Star } from "lucide-react";

const MIN_REFERENCE_TEXT = 10;
const MAX_REFERENCE_TEXT = 5000;

type ReferenceType = "client" | "peer";

type Props = Readonly<{
  token: string;
  providerName: string;
  providerTrade?: string;
  referenceType: ReferenceType;
  refereeName: string;
  relationship: string | null;
  requiresWorkDate: boolean;
}>;

type View = "form" | "submitted" | "declined";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Map a non-OK submit/decline response to a user-safe message. */
function messageForStatus(status: number, fallback: string): string {
  switch (status) {
    case 409:
      return "This reference was already submitted. There's nothing more to do — thank you.";
    case 410:
      return "This invitation link has expired. Please ask the trader to send you a new one.";
    case 429:
      return "Too many attempts. Please try again in a moment.";
    case 400:
      return fallback || "Please check your answers and try again.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

export function ReferenceSubmissionForm(props: Props) {
  const {
    token,
    providerName,
    providerTrade,
    referenceType,
    refereeName,
    relationship,
    requiresWorkDate,
  } = props;

  const isClient = referenceType === "client";
  // Work date + rating are gated on requiresWorkDate (true for client refs) so
  // the server-resolved requirement is the single source of truth.
  const showWorkDetails = requiresWorkDate;

  const [view, setView] = useState<View>("form");
  // Computed once on mount (pass the function reference, don't call it): avoids a
  // server/client hydration mismatch if the clock crosses midnight between the
  // SSR render and hydration. The server re-validates the date, so a
  // client-only value is safe.
  const [maxDate] = useState(todayIso);
  const [referenceText, setReferenceText] = useState("");
  const [relationshipValue, setRelationshipValue] = useState(relationship ?? "");
  const [workDate, setWorkDate] = useState("");
  const [rating, setRating] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decliningOpen, setDecliningOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // ConfirmationCard replaces the form as a fresh tree, so its role="status"
  // region mounts already-populated and won't be announced. Moving focus to the
  // confirmation heading gives assistive tech a natural reading start.
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);
  const isConfirmation = view === "submitted" || view === "declined";
  useEffect(() => {
    if (isConfirmation) confirmationHeadingRef.current?.focus();
  }, [isConfirmation]);

  const heading = isClient
    ? `${providerName}${providerTrade ? ` (${providerTrade})` : ""} has asked you to confirm you worked with them`
    : `${providerName}${providerTrade ? ` (${providerTrade})` : ""} has asked you to vouch for them as a fellow professional`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = referenceText.trim();
    if (trimmed.length < MIN_REFERENCE_TEXT) {
      setError(`Please write at least ${MIN_REFERENCE_TEXT} characters.`);
      return;
    }
    if (showWorkDetails && !workDate) {
      setError("Please tell us roughly when the work took place.");
      return;
    }

    // Body carries NO ids — only the referee's own answers. The token in the
    // URL is the sole reference to the invitation.
    const body: Record<string, unknown> = { reference_text: trimmed };
    if (relationshipValue.trim()) body.relationship = relationshipValue.trim();
    if (showWorkDetails) {
      body.work_date = workDate;
      if (rating > 0) body.rating = rating;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/references/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setView("submitted");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(messageForStatus(res.status, data.error ?? ""));
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (declineReason.trim()) body.reason = declineReason.trim();
      const res = await fetch(`/api/references/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setView("declined");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(messageForStatus(res.status, data.error ?? ""));
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "submitted") {
    return (
      <ConfirmationCard
        headingRef={confirmationHeadingRef}
        title="Thank you — your reference has been submitted"
        body={`We've recorded your reference for ${providerName}. It will be reviewed by our team as part of their verification on TrueDeed. You don't need to do anything else.`}
      />
    );
  }

  if (view === "declined") {
    return (
      <ConfirmationCard
        headingRef={confirmationHeadingRef}
        title="No problem — we won't ask again"
        body="Thank you for taking the time to let us know. No reference has been recorded and this link is now closed."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="bg-[#1B4D3E] px-6 py-4">
        <span className="text-sm font-semibold tracking-wide text-white">TrueDeed</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#1B4D3E]">
            Reference request
          </p>
          {/* Read-only provider identity — the referee cannot change who they vouch for. */}
          <h1 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            {heading}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Hi {refereeName}, this will only take a minute.
          </p>
          <p className="text-xs text-neutral-500">
            Fields marked <span className="text-red-600">*</span> are required.
          </p>
        </header>

        <div className="space-y-2">
          <label
            htmlFor="reference_text"
            className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            {isClient
              ? "In your own words, what was the work and how did it go?"
              : "In your own words, why would you vouch for this professional?"}
            <span className="text-red-600"> *</span>
          </label>
          <textarea
            id="reference_text"
            name="reference_text"
            required
            aria-required="true"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "reference-form-error" : undefined}
            minLength={MIN_REFERENCE_TEXT}
            maxLength={MAX_REFERENCE_TEXT}
            rows={5}
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            placeholder={
              isClient
                ? "e.g. They fitted a new bathroom for us last spring. Tidy, on time, and the finish was excellent."
                : "e.g. I've worked alongside them on several sites. Reliable, skilled, and safe to recommend."
            }
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
          <p className="text-xs text-neutral-500">
            A sentence or two is plenty. Minimum {MIN_REFERENCE_TEXT} characters.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="relationship"
            className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            How do you know them?{" "}
            <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="relationship"
            name="relationship"
            type="text"
            value={relationshipValue}
            onChange={(e) => setRelationshipValue(e.target.value)}
            placeholder={isClient ? "e.g. Customer" : "e.g. Worked together on site"}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        {showWorkDetails && (
          <>
            <div className="space-y-2">
              <label
                htmlFor="work_date"
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                Roughly when did the work take place?
                <span className="text-red-600"> *</span>
              </label>
              <input
                id="work_date"
                name="work_date"
                type="date"
                required
                aria-required="true"
                max={maxDate}
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <StarRating value={rating} onChange={setRating} />
          </>
        )}

        {error && (
          <p
            id="reference-form-error"
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163f33] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            {submitting ? "Submitting…" : "Submit reference"}
          </button>

          {!decliningOpen ? (
            <button
              type="button"
              onClick={() => setDecliningOpen(true)}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 underline-offset-2 transition hover:text-neutral-700 hover:underline dark:text-neutral-400"
            >
              I&rsquo;d rather not provide a reference
            </button>
          ) : (
            <DeclinePanel
              reason={declineReason}
              onReasonChange={setDeclineReason}
              onCancel={() => setDecliningOpen(false)}
              onConfirm={handleDecline}
              submitting={submitting}
            />
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <ShieldCheck className="size-3.5 text-[#1B4D3E]" aria-hidden="true" />
            About this request
          </p>
          <p className="text-xs leading-relaxed text-neutral-500">
            This is a formal reference used to verify this professional on
            TrueDeed. It is not a public review or testimonial. Your statement is
            kept private and may be reviewed by a TrueDeed administrator as part
            of verification.
          </p>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <Lock className="size-3.5" aria-hidden="true" />
          Private and secure · Powered by TrueDeed
        </p>
      </form>
    </div>
  );
}

function ConfirmationCard({
  title,
  body,
  headingRef,
}: {
  title: string;
  body: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="bg-[#1B4D3E] px-6 py-4">
        <span className="text-sm font-semibold tracking-wide text-white">TrueDeed</span>
      </div>
      <div
        className="flex flex-col items-center gap-3 px-6 py-10 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="size-10 text-[#1B4D3E]" aria-hidden="true" />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold text-neutral-900 outline-none dark:text-neutral-100"
        >
          {title}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {body}
        </p>
      </div>
    </div>
  );
}

function DeclinePanel({
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
  submitting,
}: {
  reason: string;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <label
        htmlFor="decline_reason"
        className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        Let them know why?{" "}
        <span className="font-normal text-neutral-500">(optional)</span>
      </label>
      <textarea
        id="decline_reason"
        rows={2}
        maxLength={1000}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="You don't have to give a reason."
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Confirm decline
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-700 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  // Real <input type="radio"> elements give keyboard arrow navigation and a
  // single tab stop for free (native radio-group semantics). The inputs are
  // visually hidden; each label renders a star. A "No rating" radio (value 0)
  // is the default checked option so the rating can stay optional — native
  // radios can't otherwise be un-checked once one is selected.
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Rating{" "}
        <span className="font-normal text-neutral-500">(optional)</span>
      </legend>
      <div className="flex items-center gap-1">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="rating"
            value={0}
            checked={value === 0}
            onChange={() => onChange(0)}
            className="sr-only"
          />
          <span className="sr-only">No rating</span>
          <span
            aria-hidden="true"
            className={`px-1 text-xs ${value === 0 ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-400"}`}
          >
            None
          </span>
        </label>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value;
          return (
            <label key={star} className="cursor-pointer rounded p-1">
              <input
                type="radio"
                name="rating"
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="peer sr-only"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              />
              <Star
                className={`size-6 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#1B4D3E]/40 ${active ? "fill-[#f5b301] text-[#f5b301]" : "text-neutral-300"}`}
                aria-hidden="true"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
