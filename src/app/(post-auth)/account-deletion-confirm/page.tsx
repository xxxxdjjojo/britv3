"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const DELETION_ITEMS = [
  "Your profile and personal account data",
  "All property listings you have created",
  "Messages, documents and saved searches",
  "Analytics, preferences and subscription history",
];

export default function AccountDeletionConfirmPage() {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCancelError("Failed to cancel deletion. Please try again.");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ scheduled_deletion_at: null })
        .eq("id", user.id);
      if (error) {
        setCancelError("Failed to cancel deletion. Please try again.");
        return;
      }
      router.push("/dashboard");
    } finally {
      setCancelling(false);
    }
  }

  async function handleProceed() {
    setProceeding(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/?deletion=scheduled");
    } finally {
      setProceeding(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Icon + Heading */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-error-light">
          <Trash2 className="size-10 text-error" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Account deletion scheduled
          </h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            Your account is scheduled for permanent deletion on{" "}
            <span className="font-semibold text-neutral-900">{deletionDate}</span>.
            You can cancel at any time before this date.
          </p>
        </div>
      </div>

      {/* What will be deleted */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Permanently deleted
        </p>
        <ul className="space-y-2.5">
          {DELETION_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-neutral-700"
            >
              <X className="mt-0.5 size-3.5 shrink-0 text-error" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* GDPR note */}
      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-5 py-3">
        <p className="text-xs leading-relaxed text-neutral-500">
          Under UK GDPR, some data may be retained for legal compliance purposes
          (e.g. financial records for 7 years). See our{" "}
          <a
            href="/privacy"
            className="text-brand-primary underline hover:text-brand-primary-light"
          >
            Privacy Policy
          </a>{" "}
          for full details.
        </p>
      </div>

      {/* Error */}
      {cancelError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-error/20 bg-error-light px-4 py-3 text-sm text-error"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {cancelError}
        </div>
      )}

      {/* Primary action — Cancel deletion */}
      <Button
        onClick={handleCancel}
        disabled={cancelling || proceeding}
        size="lg"
        className="h-12 w-full bg-brand-primary text-white hover:bg-brand-primary-light"
        aria-label="Cancel account deletion and keep your account"
      >
        {cancelling ? (
          "Cancelling…"
        ) : (
          <>
            <X className="mr-2 size-4" aria-hidden="true" />
            Cancel Deletion — Keep My Account
          </>
        )}
      </Button>

      {/* Secondary action — proceed with deletion */}
      <div className="text-center">
        <button
          onClick={handleProceed}
          disabled={cancelling || proceeding}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Proceed with account deletion"
        >
          {proceeding ? (
            "Processing…"
          ) : (
            <>
              I understand, proceed with deletion
              <ArrowRight className="size-3" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
