"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, Trash2 } from "lucide-react";
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

  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  async function handleCancel() {
    setCancelling(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ scheduled_deletion_at: null })
          .eq("id", user.id);
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
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
          <CalendarX className="size-8 text-neutral-600" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900">
          Your account deletion is scheduled
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          Deletion will happen on{" "}
          <span className="font-medium text-neutral-900">{deletionDate}</span>
        </p>
      </div>

      <div className="rounded-xl bg-neutral-50 p-4">
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

      <Button
        onClick={handleCancel}
        disabled={cancelling || proceeding}
        size="lg"
        className="w-full"
      >
        {cancelling ? "Cancelling…" : "Cancel Deletion — Keep My Account"}
      </Button>

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
