"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CtaState = "idle" | "pending" | "optedIn" | "notAgent" | "error";

/**
 * Opt-in CTA for the Honest Agent Awards. Unauthenticated visitors are
 * routed to login (and back here); authenticated non-agency users get an
 * honest explanation instead of a dead button. Opting in is free — there is
 * no payment step anywhere in the awards.
 */
export function AwardsOptInCta({
  initialOptedIn,
}: Readonly<{ initialOptedIn: boolean }>) {
  const router = useRouter();
  const [state, setState] = useState<CtaState>(initialOptedIn ? "optedIn" : "idle");

  async function handleOptIn() {
    setState("pending");
    try {
      const res = await fetch("/api/awards/nominations", { method: "POST" });
      if (res.status === 401) {
        router.push("/login?redirectTo=/awards");
        return;
      }
      if (res.status === 403) {
        setState("notAgent");
        return;
      }
      setState(res.ok ? "optedIn" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "optedIn") {
    return (
      <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary bg-brand-primary/10 px-5 py-2.5 text-sm font-semibold text-brand-primary-dark">
        Your agency is opted in — track your standing from your agent dashboard.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleOptIn}
        disabled={state === "pending"}
        className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-60"
      >
        {state === "pending" ? "Opting in…" : "Opt my agency in — free, always"}
      </button>
      {state === "notAgent" && (
        <p className="text-sm text-neutral-600" role="status">
          Opting in needs an estate agency team account. If your agency is on
          TrueDeed, ask a team member to opt in from their account.
        </p>
      )}
      {state === "error" && (
        <p className="text-sm text-neutral-600" role="status">
          Something went wrong — please try again.
        </p>
      )}
    </div>
  );
}
