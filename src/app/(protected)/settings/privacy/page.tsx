"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentForm } from "@/components/gdpr/ConsentForm";
import { DataExportButton } from "@/components/gdpr/DataExportButton";
import { createClient } from "@/lib/supabase/client";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "DELETE") return;

    setDeleting(true);
    try {
      const response = await fetch("/api/gdpr/delete", { method: "POST" });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Deletion failed");
      }

      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Account scheduled for deletion");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process deletion request",
      );
    } finally {
      setDeleting(false);
      setDialogOpen(false);
      setDeleteConfirmation("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
          Privacy & Data
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your consent preferences and personal data
        </p>
      </div>

      {/* Section 1: Consent Preferences */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Consent Preferences
        </h3>
        <p className="font-body text-sm text-neutral-500">
          Choose what data you allow us to collect and how we use it.
        </p>
        <ConsentForm />
      </section>

      {/* Section 2: Your Data */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Your Data
        </h3>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 size-5 text-brand-primary" />
            <div>
              <p className="font-body text-sm font-medium text-neutral-900">
                Download your data
              </p>
              <p className="font-body text-xs text-neutral-500">
                Download a copy of all data we hold about you in JSON format.
              </p>
            </div>
          </div>
          <DataExportButton />
        </div>
      </section>

      {/* Section 3: Delete Account */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Delete Account
        </h3>
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-error" />
            <div className="space-y-2">
              <p className="font-body text-sm font-medium text-neutral-900">
                Permanently delete your account
              </p>
              <ul className="list-inside list-disc space-y-1 font-body text-xs text-neutral-600">
                <li>
                  Your account will be scheduled for deletion in 30 days
                </li>
                <li>
                  You can cancel deletion by logging back in within the grace
                  period
                </li>
                <li>
                  After 30 days, all your data will be permanently deleted
                </li>
              </ul>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={
                    <Button variant="destructive" size="sm" className="mt-2" />
                  }
                >
                  <Trash2 className="size-4" />
                  Delete My Account
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action will schedule your account for permanent
                      deletion. All your data will be removed after a 30-day
                      grace period.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="delete-confirmation">
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE"
                      className="font-mono"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setDeleteConfirmation("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE" || deleting}
                    >
                      {deleting ? "Deleting..." : "Delete My Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
