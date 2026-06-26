"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Download, Mail } from "lucide-react";

const GUIDE_PDF_PATH = "/guides/landlord-guide.pdf";

type FormStatus = "idle" | "submitting" | "success" | "error";

type LandlordGuideDownloadFormProps = Readonly<{
  className?: string;
}>;

export function LandlordGuideDownloadForm({
  className,
}: LandlordGuideDownloadFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const submitting = status === "submitting";
  const isUnlocked = status === "success";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || isUnlocked) return;

    setStatus("submitting");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landlord_guide" }),
      });

      const data: { ok?: boolean; alreadySubscribed?: boolean } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.ok) {
        setStatus("error");
        return;
      }

      setAlreadySubscribed(Boolean(data.alreadySubscribed));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (isUnlocked) {
    return (
      <div
        className={["rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter/60 p-6 sm:p-8", className]
          .filter(Boolean)
          .join(" ")}
      >
        <p
          role="status"
          aria-live="polite"
          className="text-sm font-semibold text-brand-primary-dark"
        >
          Your guide is ready.
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          {alreadySubscribed
            ? "You're already on our list — here's your copy, and we've emailed it to you too."
            : "We've also emailed a copy to your inbox for safekeeping."}
        </p>
        <a
          href={GUIDE_PDF_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2"
        >
          <Download className="size-5" aria-hidden="true" />
          Download the guide (PDF)
        </a>
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
        <div className="flex flex-1 items-center overflow-hidden rounded-full border border-brand-primary/20 bg-white shadow-sm focus-within:ring-2 focus-within:ring-brand-primary/30">
          <span className="flex items-center pl-5 text-neutral-400" aria-hidden="true">
            <Mail className="size-5" />
          </span>
          <input
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            disabled={submitting}
            aria-invalid={status === "error" ? true : undefined}
            aria-describedby={status === "error" ? `${emailId}-error` : undefined}
            className="flex-1 bg-transparent px-4 py-3.5 text-base text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-full bg-brand-primary px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Sending…" : "Send me the guide"}
        </button>
      </div>

      <p
        id={`${emailId}-error`}
        role="status"
        aria-live="polite"
        className="mt-3 min-h-[1.25rem] text-sm text-red-600"
      >
        {status === "error"
          ? "Something went wrong. Please check your email and try again."
          : null}
      </p>

      <p className="mt-1 text-xs text-neutral-500">
        Free, no spam. We&apos;ll send you the PDF and occasional landlord
        updates. Unsubscribe any time.
      </p>
    </form>
  );
}
