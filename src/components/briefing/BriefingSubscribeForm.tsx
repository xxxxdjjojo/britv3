"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { trackBriefingSubscribed } from "@/lib/analytics/influence-events";

type BriefingSubscribeFormProps = Readonly<{
  /** Where the signup originated, sent to the API for attribution. */
  source?: string;
  /** True when arriving from the confirm email (?subscribed=1). */
  initialConfirmed?: boolean;
  className?: string;
}>;

type FormStatus =
  | "idle"
  | "submitting"
  | "check_inbox"
  | "confirmed"
  | "error";

const MESSAGES: Record<Exclude<FormStatus, "idle" | "submitting">, string> = {
  check_inbox:
    "Check your inbox to confirm — we only add you once you click the link.",
  confirmed: "You're confirmed. The next briefing lands in your inbox.",
  error: "Something went wrong. Please try again.",
};

export function BriefingSubscribeForm({
  source = "agent_briefing_landing",
  initialConfirmed = false,
  className,
}: BriefingSubscribeFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>(
    initialConfirmed ? "confirmed" : "idle",
  );

  const submitting = status === "submitting";
  const isDone = status === "check_inbox" || status === "confirmed";
  const message =
    status === "idle" || status === "submitting" ? null : MESSAGES[status];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || isDone) return;

    setStatus("submitting");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, audience: "agent_briefing" }),
      });

      const data: { ok?: boolean; requiresConfirmation?: boolean } =
        await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setStatus("error");
        return;
      }

      trackBriefingSubscribed("agent_briefing");
      setStatus(data.requiresConfirmation ? "check_inbox" : "confirmed");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (isDone) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={[
          "flex items-start gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary-lighter/40 p-4",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <MailCheck className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-brand-primary">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={emailId}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@youragency.co.uk"
          autoComplete="email"
          disabled={submitting}
          aria-invalid={status === "error" ? true : undefined}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Subscribing…" : "Get the briefing"}
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`mt-3 min-h-[1.25rem] text-sm ${status === "error" ? "text-red-600" : "text-brand-primary"}`}
      >
        {message}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        One email a week. Double opt-in — nothing is sent until you confirm.
        Unsubscribe in one click from every email; no data shared with anyone.
      </p>
    </form>
  );
}
