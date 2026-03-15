"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ConsentForm } from "@/components/gdpr/ConsentForm";
import { DataExportButton } from "@/components/gdpr/DataExportButton";
import { createClient } from "@/lib/supabase/client";

type VisibilityValue = "public" | "registered_only" | "private";

type PrivacySettings = {
  visibility: VisibilityValue;
  search_indexing: boolean;
  anonymous_analytics: boolean;
  third_party_marketing: boolean;
  active_status: boolean;
  last_viewed_visible: boolean;
};

const DEFAULT_SETTINGS: PrivacySettings = {
  visibility: "registered_only",
  search_indexing: true,
  anonymous_analytics: true,
  third_party_marketing: false,
  active_status: true,
  last_viewed_visible: false,
};

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings/privacy");
        if (!response.ok) return;
        const data = (await response.json()) as Partial<PrivacySettings>;
        setSettings((prev) => ({ ...prev, ...data }));
      } catch {
        // keep defaults if fetch fails
      } finally {
        setLoading(false);
      }
    }
    void fetchSettings();
  }, []);

  async function updateSetting<K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) {
    const previous = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      const response = await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      toast.success("Saved");
    } catch {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast.error("Failed to save");
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "DELETE") return;

    setDeleting(true);
    try {
      const response = await fetch("/api/gdpr/delete", { method: "POST" });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Deletion failed");
      }

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

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
            Privacy & Data
          </h2>
          <p className="mt-1 font-body text-sm text-neutral-500">
            Manage your privacy, consent preferences, and personal data
          </p>
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
          Privacy & Data
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your privacy, consent preferences, and personal data
        </p>
      </div>

      {/* Section 1: Profile Visibility */}
      <section className="rounded-lg border border-neutral-200 p-6">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Profile Visibility
        </h3>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Control who can see your profile on Britestate.
        </p>

        <div className="mt-4">
          <RadioGroup
            value={settings.visibility}
            onValueChange={(value) =>
              void updateSetting("visibility", value as VisibilityValue)
            }
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="public" id="visibility-public" />
              <div className="-mt-0.5">
                <Label
                  htmlFor="visibility-public"
                  className="font-body text-sm font-medium text-neutral-900 cursor-pointer"
                >
                  Public
                </Label>
                <p className="font-body text-xs text-neutral-500">
                  Anyone can view your profile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RadioGroupItem
                value="registered_only"
                id="visibility-registered"
              />
              <div className="-mt-0.5">
                <Label
                  htmlFor="visibility-registered"
                  className="font-body text-sm font-medium text-neutral-900 cursor-pointer"
                >
                  Registered Users Only
                </Label>
                <p className="font-body text-xs text-neutral-500">
                  Only logged-in users can view your profile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RadioGroupItem value="private" id="visibility-private" />
              <div className="-mt-0.5">
                <Label
                  htmlFor="visibility-private"
                  className="font-body text-sm font-medium text-neutral-900 cursor-pointer"
                >
                  Private
                </Label>
                <p className="font-body text-xs text-neutral-500">
                  Only you can see your profile
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-5" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-sm font-medium text-neutral-900">
              Search Engine Indexing
            </p>
            <p className="font-body text-xs text-neutral-500">
              Allow search engines to index your profile
            </p>
          </div>
          <Switch
            checked={settings.search_indexing}
            onCheckedChange={(checked) =>
              void updateSetting("search_indexing", checked)
            }
            aria-label="Search engine indexing"
          />
        </div>
      </section>

      {/* Section 2: Data Sharing */}
      <section className="rounded-lg border border-neutral-200 p-6">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Data Sharing
        </h3>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Choose how your data can be used beyond core platform functionality.
        </p>

        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="anonymous-analytics"
              checked={settings.anonymous_analytics}
              onCheckedChange={(checked) =>
                void updateSetting("anonymous_analytics", checked === true)
              }
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="anonymous-analytics"
                className="font-body text-sm font-medium text-neutral-900 cursor-pointer"
              >
                Anonymous Analytics
              </Label>
              <p className="font-body text-xs text-neutral-500">
                Help us improve the platform with anonymised usage data
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="third-party-marketing"
              checked={settings.third_party_marketing}
              onCheckedChange={(checked) =>
                void updateSetting("third_party_marketing", checked === true)
              }
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="third-party-marketing"
                className="font-body text-sm font-medium text-neutral-900 cursor-pointer"
              >
                Third-party Marketing
              </Label>
              <p className="font-body text-xs text-neutral-500">
                Receive personalised offers from our partners
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Activity Visibility */}
      <section className="rounded-lg border border-neutral-200 p-6">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Activity Visibility
        </h3>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Control what others can see about your activity on the platform.
        </p>

        <div className="mt-4 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm font-medium text-neutral-900">
                Active Status
              </p>
              <p className="font-body text-xs text-neutral-500">
                Show when you were last active
              </p>
            </div>
            <Switch
              checked={settings.active_status}
              onCheckedChange={(checked) =>
                void updateSetting("active_status", checked)
              }
              aria-label="Active status"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm font-medium text-neutral-900">
                Last Viewed Properties
              </p>
              <p className="font-body text-xs text-neutral-500">
                Let agents see which properties you&apos;ve viewed
              </p>
            </div>
            <Switch
              checked={settings.last_viewed_visible}
              onCheckedChange={(checked) =>
                void updateSetting("last_viewed_visible", checked)
              }
              aria-label="Last viewed properties visibility"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Consent Preferences */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Consent Preferences
        </h3>
        <p className="font-body text-sm text-neutral-500">
          Choose what data you allow us to collect and how we use it.
        </p>
        <ConsentForm />
      </section>

      {/* Section 5: Your Data */}
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

      {/* Section 6: Delete Account */}
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
                      onClick={() => void handleDeleteAccount()}
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
