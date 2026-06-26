"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Mail } from "lucide-react";

type NewsletterFormProps = Readonly<{
  /** Where the signup originated, sent to the API for attribution. */
  source?: string;
  /** Visual treatment: "inline" for hero rows, "card" for boxed sidebar widgets. */
  variant?: "inline" | "card";
  className?: string;
}>;

type FormStatus = "idle" | "submitting" | "success" | "duplicate" | "error";

const MESSAGES: Record<Exclude<FormStatus, "idle" | "submitting">, string> = {
  success: "You're subscribed — check your inbox.",
  duplicate: "You're already on the list — thanks for subscribing.",
  error: "Something went wrong. Please try again.",
};

export function NewsletterForm({
  source = "blog",
  variant = "inline",
  className,
}: NewsletterFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const submitting = status === "submitting";
  const isDone = status === "success" || status === "duplicate";
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
        body: JSON.stringify({ email, source }),
      });

      const data: { ok?: boolean; alreadySubscribed?: boolean } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.ok) {
        setStatus("error");
        return;
      }

      setStatus(data.alreadySubscribed ? "duplicate" : "success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  const isCard = variant === "card";
  const messageTone =
    status === "error" ? "text-red-600" : "text-brand-primary";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={[isCard ? "w-full" : "mx-auto w-full max-w-md", className]
        .filter(Boolean)
        .join(" ")}
    >
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>

      {isCard ? (
        <div className="flex flex-col gap-3">
          <input
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email address"
            autoComplete="email"
            disabled={submitting || isDone}
            aria-invalid={status === "error" ? true : undefined}
            className="w-full rounded-lg border border-brand-primary/20 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={submitting || isDone}
            className="w-full rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Subscribing…" : isDone ? "Subscribed" : "Subscribe"}
          </button>
        </div>
      ) : (
        <div className="flex w-full overflow-hidden rounded-full border border-neutral-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-brand-primary/30">
          <span className="flex items-center pl-5 text-neutral-400" aria-hidden="true">
            <Mail className="size-5" />
          </span>
          <input
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={submitting || isDone}
            aria-invalid={status === "error" ? true : undefined}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={submitting || isDone}
            className="shrink-0 bg-brand-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Subscribing…" : isDone ? "Subscribed" : "Subscribe"}
          </button>
        </div>
      )}

      <p
        role="status"
        aria-live="polite"
        className={`mt-3 min-h-[1.25rem] text-sm ${isCard ? "text-left" : "text-center"} ${messageTone}`}
      >
        {message}
      </p>
    </form>
  );
}
