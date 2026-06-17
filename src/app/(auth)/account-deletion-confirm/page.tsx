"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const DELETION_ITEMS = [
  "Your profile and account data",
  "All property listings you have created",
  "Messages and documents",
  "Analytics and saved preferences",
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
      const { data: { user } } = await supabase.auth.getUser();
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
    <div className="space-y-6">
      {/* Icon + badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-warning/10">
          <CalendarX className="size-8 text-warning" />
        </div>
        <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-3 py-0.5 font-body text-xs font-semibold uppercase tracking-wide text-warning">
          Scheduled
        </span>
      </div>

      {/* Heading + date */}
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-primary-dark">
          Your account deletion is scheduled
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          Deletion will happen on{" "}
          <span className="font-medium text-neutral-900">{deletionDate}</span>
        </p>
      </div>

      {/* Deletion items list */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <p className="mb-3 font-body text-sm font-medium text-neutral-700">
          The following will be permanently deleted:
        </p>
        <ul className="space-y-2">
          {DELETION_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 font-body text-sm text-neutral-600">
              <Trash2 className="mt-0.5 size-3.5 shrink-0 text-neutral-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Error state */}
      {cancelError && (
        <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" />
          {cancelError}
        </div>
      )}

      {/* Primary action */}
      <Button
        onClick={handleCancel}
        disabled={cancelling || proceeding}
        size="lg"
        className="w-full"
      >
        {cancelling ? "Cancelling…" : "Cancel Deletion — Keep My Account"}
      </Button>

      {/* Destructive secondary */}
      <p className="text-center">
        <button
          onClick={handleProceed}
          disabled={cancelling || proceeding}
          className="font-body text-xs text-neutral-400 hover:text-neutral-600 hover:underline disabled:cursor-not-allowed"
        >
          {proceeding ? "Processing…" : "I understand, proceed with deletion"}
        </button>
      </p>
    </div>
  );
}
