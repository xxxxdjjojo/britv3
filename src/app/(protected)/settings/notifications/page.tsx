"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type NotificationPrefs = Record<string, boolean>;

type ChannelDef = {
  id: "email" | "push" | "sms" | "inapp";
  label: string;
  icon: typeof Mail;
};

const CHANNELS: readonly ChannelDef[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "push", label: "Push", icon: Bell },
  { id: "sms", label: "SMS", icon: Smartphone },
  { id: "inapp", label: "In-App", icon: MessageSquare },
];

type CategoryDef = {
  id: string;
  title: string;
  description: string;
};

const CATEGORIES: readonly CategoryDef[] = [
  {
    id: "property_alerts",
    title: "Property Alerts",
    description: "New properties matching your saved searches and price changes.",
  },
  {
    id: "viewings",
    title: "Viewings",
    description: "Reminders, confirmations, and updates for scheduled viewings.",
  },
  {
    id: "offers",
    title: "Offers & Counter-offers",
    description: "Notifications when offers are made, accepted, or countered.",
  },
  {
    id: "messages",
    title: "Direct Messages",
    description: "Alerts when you receive new messages or replies.",
  },
  {
    id: "market_reports",
    title: "Market Reports",
    description: "Weekly market insights, area price trends, and investment summaries.",
  },
];

/** Build the preference key from category + channel, e.g. "viewings_email" */
function prefKey(categoryId: string, channelId: string): string {
  return `${categoryId}_${channelId}`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonMatrix() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="flex items-center gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-5 w-10 animate-pulse rounded bg-neutral-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/settings/notifications");
        if (!res.ok) throw new Error("Failed to load");
        const data: NotificationPrefs = await res.json();
        setPrefs(data);
      } catch {
        // Fall back to empty — API returns migrated defaults anyway
      } finally {
        setLoading(false);
      }
    }
    void loadPrefs();
  }, []);

  async function handleToggle(key: string, value: boolean) {
    // Optimistic update — single key only
    setPrefs((prev) => ({ ...prev, [key]: value }));

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Saved", { duration: 2000 });
    } catch {
      // Revert only the toggled key
      setPrefs((prev) => ({ ...prev, [key]: !value }));
      toast.error("Failed to save. Please try again.");
    }
  }

  async function handleUnsubscribeMarketing() {
    const marketingKeys = CHANNELS.map((ch) => prefKey("market_reports", ch.id));
    const updates: Record<string, boolean> = {};
    for (const k of marketingKeys) {
      updates[k] = false;
    }

    // Optimistic
    setPrefs((prev) => ({ ...prev, ...updates }));

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Unsubscribed from all marketing communications.", { duration: 3000 });
    } catch {
      // Revert
      const reverts: Record<string, boolean> = {};
      for (const k of marketingKeys) {
        reverts[k] = true;
      }
      setPrefs((prev) => ({ ...prev, ...reverts }));
      toast.error("Failed to unsubscribe. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-neutral-900 dark:text-white">
          Notifications
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Choose how and when you hear from us.
        </p>
      </div>

      {/* Security Alerts — always on, non-toggleable */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Security Alerts
        </h3>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="font-body text-sm text-neutral-600 dark:text-neutral-400">
            Security notifications are always enabled and cannot be turned off.
            You will receive email alerts for:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-body text-sm text-neutral-700 dark:text-neutral-300">
            <li>Password changes</li>
            <li>Two-factor authentication changes</li>
            <li>New device logins</li>
            <li>Email address changes</li>
            <li>Connected account changes</li>
          </ul>
        </div>
      </section>

      {/* 5×4 Notification Matrix */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Notification Channels
        </h3>

        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          {/* Channel header row */}
          <div className="hidden border-b border-neutral-100 px-4 py-3 dark:border-neutral-700 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1" />
            <div className="flex shrink-0 items-center gap-4">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div
                    key={ch.id}
                    className="flex w-16 flex-col items-center gap-1"
                  >
                    <Icon className="size-3.5 text-neutral-400" />
                    <span className="font-body text-xs font-medium text-neutral-500">
                      {ch.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {loading ? (
            <SkeletonMatrix />
          ) : (
            CATEGORIES.map((category, idx) => (
              <div
                key={category.id}
                className={
                  idx < CATEGORIES.length - 1
                    ? "border-b border-neutral-100 dark:border-neutral-700"
                    : ""
                }
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Category label */}
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                      {category.title}
                    </p>
                    <p className="font-body text-xs text-neutral-500">
                      {category.description}
                    </p>
                  </div>

                  {/* Channel toggles */}
                  <div className="flex shrink-0 items-center gap-4">
                    {CHANNELS.map((ch) => {
                      const key = prefKey(category.id, ch.id);
                      const Icon = ch.icon;
                      const toggleId = `${category.id}-${ch.id}`;
                      return (
                        <div
                          key={ch.id}
                          className="flex w-16 flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2"
                        >
                          <Icon className="size-3.5 text-neutral-400 sm:hidden" />
                          <Label
                            htmlFor={toggleId}
                            className="cursor-pointer font-body text-xs text-neutral-500 sm:sr-only"
                          >
                            {ch.label}
                          </Label>
                          <Switch
                            id={toggleId}
                            checked={prefs[key] ?? false}
                            onCheckedChange={(checked) =>
                              handleToggle(key, checked)
                            }
                            size="sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Marketing Unsubscribe — GDPR */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Marketing Preferences
        </h3>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
              <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                  Unsubscribe from Marketing
                </p>
                <p className="mt-1 font-body text-xs text-neutral-500">
                  Under GDPR, you have the right to opt out of all marketing
                  communications at any time. This will disable market reports
                  across all channels (email, push, SMS, and in-app).
                </p>
              </div>
              <button
                type="button"
                onClick={handleUnsubscribeMarketing}
                className="rounded-md bg-neutral-900 px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                Unsubscribe from all marketing
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
