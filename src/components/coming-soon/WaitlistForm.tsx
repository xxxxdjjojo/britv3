"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import type { HeadlineVariantId } from "@/components/coming-soon/variants";

type WaitlistFormProps = Readonly<{
  variantId?: HeadlineVariantId;
  referredBy?: string | null;
  cta?: string;
}>;

export function WaitlistForm({ variantId, referredBy, cta }: WaitlistFormProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const submitting = status === "submitting";
  const label = cta ?? "Get Early Access";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ref: referredBy ?? undefined,
          variant: variantId ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("request_failed");
      }

      const data: { code?: string } = await response.json();
      if (!data.code) {
        throw new Error("missing_code");
      }

      posthog?.capture?.("waitlist_signup", { variant: variantId });
      router.push(`/queue?ref=${data.code}`);
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto w-full max-w-xl"
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={submitting}
            aria-invalid={error ? true : undefined}
            className="h-14 w-full rounded-full border border-white/15 bg-white/10 px-6 text-base text-white placeholder:text-white/45 backdrop-blur transition-colors duration-200 focus:border-[#FDCD74]/60 focus:outline-none focus:ring-2 focus:ring-[#FDCD74] focus:ring-offset-2 focus:ring-offset-[#04130C] disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[#FDCD74] px-8 text-base font-semibold text-[#04130C] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(253,205,116,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDCD74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04130C] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Joining…" : label}
          {!submitting && (
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              &rarr;
            </span>
          )}
        </button>
      </div>

      <p
        role="alert"
        aria-live="polite"
        className="mt-3 min-h-[1.25rem] text-sm text-[#FDCD74]"
      >
        {error}
      </p>
    </form>
  );
}
