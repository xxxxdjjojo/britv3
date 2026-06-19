"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Eye, Ghost, Trash2, Users } from "lucide-react";
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
import { ReauthDialog } from "@/components/settings/ReauthDialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  visibility: "public",
  search_indexing: true,
  anonymous_analytics: true,
  third_party_marketing: false,
  active_status: true,
  last_viewed_visible: false,
};

// ---------------------------------------------------------------------------
// Quick Privacy Mode presets
// ---------------------------------------------------------------------------

type PrivacyMode = "public" | "members-only" | "ghost";

const PRIVACY_MODES: {
  id: PrivacyMode;
  label: string;
  description: string;
  icon: typeof Eye;
  visibilityValue: VisibilityValue;
  settings: Partial<PrivacySettings>;
}[] = [
  {
    id: "public",
    label: "Public",
    description: "Maximum visibility. Your profile and activity are visible to everyone.",
    icon: Eye,
    visibilityValue: "public",
    settings: {
      visibility: "public",
      search_indexing: true,
      active_status: true,
      last_viewed_visible: true,
    },
  },
  {
    id: "members-only",
    label: "Members Only",
    description: "Visible to registered TrueDeed users only. Hidden from search engines.",
    icon: Users,
    visibilityValue: "registered_only",
    settings: {
      visibility: "registered_only",
      search_indexing: false,
      active_status: true,
      last_viewed_visible: false,
    },
  },
  {
    id: "ghost",
    label: "Ghost",
    description: "Maximum privacy. Your profile is private and all tracking is off.",
    icon: Ghost,
    visibilityValue: "private",
    settings: {
      visibility: "private",
      search_indexing: false,
      anonymous_analytics: false,
      active_status: false,
      last_viewed_visible: false,
      third_party_marketing: false,
    },
  },
];

function detectCurrentMode(settings: PrivacySettings): PrivacyMode | null {
  for (const mode of PRIVACY_MODES) {
    const match = Object.entries(mode.settings).every(
      ([key, value]) => settings[key as keyof PrivacySettings] === value,
    );
    if (match) return mode.id;
  }
  return null;
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteReauthOpen, setDeleteReauthOpen] = useState(false);

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

  async function applyPrivacyMode(mode: PrivacyMode) {
    const preset = PRIVACY_MODES.find((m) => m.id === mode);
    if (!preset) return;

    const previousSettings = { ...settings };
    const newSettings = { ...settings, ...preset.settings };
    setSettings(newSettings);

    try {
      const response = await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset.settings),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      toast.success(`${preset.label} mode applied`);
    } catch {
      setSettings(previousSettings);
      toast.error("Failed to apply privacy mode");
    }
  }

  const currentMode = detectCurrentMode(settings);

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "DELETE") return;
    setDialogOpen(false);
    setDeleteConfirmation("");
    setDeleteReauthOpen(true);
  }

  async function handleDeleteReauthSuccess(token: string) {
    setDeleting(true);
    try {
      const response = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reauth_token: token }),
      });

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
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Editorial header skeleton */}
        <header className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Privacy &amp; Data
          </p>
          <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Privacy &amp; Data
          </h1>
          <p className="mt-3 max-w-2xl font-body text-base text-neutral-500">
            Manage your privacy, consent preferences, and personal data
          </p>
        </header>
        <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* ── Editorial page header ── */}
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Privacy &amp; Data
        </p>
        <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          Privacy &amp; Data
        </h1>
        <p className="mt-3 max-w-2xl font-body text-base text-neutral-500">
          Manage your privacy, consent preferences, and personal data
        </p>
      </header>

      {/* ── Section 1: Profile Visibility (Quick Privacy Mode) ── */}
      <section className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark">
            Profile Visibility
          </h2>
          {currentMode && (
            <span className="rounded-full bg-brand-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-gold-foreground">
              Quick Privacy Mode
            </span>
          )}
        </div>

        {/* 3-card visibility grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PRIVACY_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => void applyPrivacyMode(mode.id)}
                className={cn(
                  "relative flex flex-col items-start gap-4 rounded-xl border-2 p-8 text-left transition-all duration-200",
                  isActive
                    ? "border-brand-primary bg-surface shadow-sm"
                    : "border-border bg-white hover:border-brand-primary/40 hover:shadow-sm",
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <CheckCircle2 className="absolute right-4 top-4 size-5 text-brand-primary" />
                )}

                {/* Icon badge */}
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full transition-transform duration-200",
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "bg-neutral-100 text-neutral-500",
                    "group-hover:scale-110",
                  )}
                >
                  <Icon className="size-5" />
                </div>

                <div>
                  <p className="font-heading text-sm font-bold text-brand-primary-dark">
                    {mode.label}
                  </p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-neutral-500">
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle panel */}
        <div className="rounded-2xl bg-surface p-8 space-y-8">
          {/* Search Engine Indexing */}
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-heading text-sm font-semibold text-brand-primary-dark">
                Search Engine Indexing
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-neutral-500">
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

          <Separator />

          {/* Data Sharing Preferences */}
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-heading text-sm font-semibold text-brand-primary-dark">
                Data Sharing Preferences
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-neutral-500">
                Help us improve the platform with anonymised usage data
              </p>
            </div>
            <Switch
              checked={settings.anonymous_analytics}
              onCheckedChange={(checked) =>
                void updateSetting("anonymous_analytics", checked)
              }
              aria-label="Anonymous analytics"
            />
          </div>

          <Separator />

          {/* Third-party Marketing */}
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-heading text-sm font-semibold text-brand-primary-dark">
                Third-party Marketing
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-neutral-500">
                Receive personalised offers from our partners
              </p>
            </div>
            <Checkbox
              id="third-party-marketing"
              checked={settings.third_party_marketing}
              onCheckedChange={(checked) =>
                void updateSetting("third_party_marketing", checked === true)
              }
              aria-label="Third-party marketing"
            />
          </div>

          <Separator />

          {/* Active Status */}
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-heading text-sm font-semibold text-brand-primary-dark">
                Active Status
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-neutral-500">
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

          {/* Last Viewed Properties */}
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-heading text-sm font-semibold text-brand-primary-dark">
                Last Viewed Properties
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-neutral-500">
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

        {/* Hidden radio group preserved for a11y/form semantics — visually replaced by card buttons above */}
        <div className="sr-only">
          <RadioGroup
            value={settings.visibility}
            onValueChange={(value) =>
              void updateSetting("visibility", value as VisibilityValue)
            }
          >
            <RadioGroupItem value="public" id="visibility-public" />
            <Label htmlFor="visibility-public">Public</Label>
            <RadioGroupItem value="registered_only" id="visibility-registered" />
            <Label htmlFor="visibility-registered">Registered Users Only</Label>
            <RadioGroupItem value="private" id="visibility-private" />
            <Label htmlFor="visibility-private">Private</Label>
          </RadioGroup>
        </div>
      </section>

      {/* ── Section 2: Consent Preferences ── */}
      <section className="space-y-6">
        <h2 className="font-heading text-2xl font-bold text-brand-primary-dark">
          Consent Preferences
        </h2>
        <p className="font-body text-sm text-neutral-500">
          Choose what data you allow us to collect and how we use it.
        </p>
        <ConsentForm />
      </section>

      {/* ── Bottom split: Archive & Data | Danger Zone ── */}
      <div className="border-t border-border pt-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Archive & Data */}
          <section className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-brand-primary-dark">
              Your Data
            </h2>
            <p className="font-body text-sm leading-relaxed text-neutral-500">
              Download a copy of all data we hold about you in JSON format.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Download className="size-4 text-brand-primary" />
              <DataExportButton />
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-error">
              Delete Account
            </h2>
            <p className="font-body text-sm leading-relaxed text-neutral-500">
              Permanently delete your account
            </p>
            <ul className="space-y-1 font-body text-xs text-neutral-600">
              <li>Your account will be scheduled for deletion in 30 days</li>
              <li>You can cancel deletion by logging back in within the grace period</li>
              <li>After 30 days, all your data will be permanently deleted</li>
            </ul>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-error text-error hover:bg-error/10"
                  />
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
          </section>
        </div>
      </div>

      <ReauthDialog
        open={deleteReauthOpen}
        onOpenChange={setDeleteReauthOpen}
        onSuccess={handleDeleteReauthSuccess}
        title="Confirm account deletion"
        description="Enter your password to permanently delete your account."
      />
    </div>
  );
}
