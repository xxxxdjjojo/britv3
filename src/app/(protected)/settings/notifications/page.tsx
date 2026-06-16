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
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="flex items-center gap-6">
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
      {/* Page header — editorial eyebrow + large heading */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Notifications
        </p>
        <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl dark:text-white">
          Notifications
        </h2>
        <p className="mt-2 font-body text-sm text-neutral-500">
          Choose how and when you hear from us.
        </p>
      </div>

      {/* 5×4 Notification Matrix */}
      <section aria-label="Notification Channels">
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm dark:bg-neutral-900">
          {/* Column header row */}
          <div className="hidden border-b border-border bg-surface px-5 py-3 dark:bg-neutral-800/50 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                Event Type
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-6">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div key={ch.id} className="flex w-14 flex-col items-center gap-1">
                    <Icon className="size-3.5 text-neutral-400" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                      {ch.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            <SkeletonMatrix />
          ) : (
            <div className="divide-y divide-border">
              {CATEGORIES.map((category) => (
                <div key={category.id}>
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Category label */}
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-semibold text-neutral-900 dark:text-white">
                        {category.title}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-neutral-500">
                        {category.description}
                      </p>
                    </div>

                    {/* Channel toggles */}
                    <div className="flex shrink-0 items-center gap-6">
                      {CHANNELS.map((ch) => {
                        const key = prefKey(category.id, ch.id);
                        const Icon = ch.icon;
                        const toggleId = `${category.id}-${ch.id}`;
                        return (
                          <div
                            key={ch.id}
                            className="flex w-14 flex-col items-center gap-1 sm:items-center sm:justify-center"
                          >
                            {/* Mobile: show icon + label above toggle */}
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
                              onCheckedChange={(checked) => handleToggle(key, checked)}
                              size="sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer row — unsubscribe link */}
          <div className="flex items-center justify-end border-t border-border bg-surface px-5 py-4 dark:bg-neutral-800/50">
            <button
              type="button"
              onClick={handleUnsubscribeMarketing}
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 transition-colors hover:text-error"
            >
              Unsubscribe from all marketing
            </button>
          </div>
        </div>
      </section>

      {/* Security Alerts card — always-on notice */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="rounded-lg bg-warning/10 p-2">
            <ShieldAlert className="size-4 text-warning" />
          </div>
          <h3 className="font-heading text-sm font-semibold text-neutral-900 dark:text-white">
            Security Alerts
          </h3>
        </div>
        <p className="font-body text-xs text-neutral-500 dark:text-neutral-400">
          Security notifications are always enabled and cannot be turned off.
          You will receive email alerts for:
        </p>
        <ul className="mt-2 space-y-1 font-body text-xs text-neutral-600 dark:text-neutral-300">
          <li className="flex items-center gap-1.5 before:size-1 before:shrink-0 before:rounded-full before:bg-neutral-400 before:content-['']">Password changes</li>
          <li className="flex items-center gap-1.5 before:size-1 before:shrink-0 before:rounded-full before:bg-neutral-400 before:content-['']">Two-factor authentication changes</li>
          <li className="flex items-center gap-1.5 before:size-1 before:shrink-0 before:rounded-full before:bg-neutral-400 before:content-['']">New device logins</li>
          <li className="flex items-center gap-1.5 before:size-1 before:shrink-0 before:rounded-full before:bg-neutral-400 before:content-['']">Email address changes</li>
          <li className="flex items-center gap-1.5 before:size-1 before:shrink-0 before:rounded-full before:bg-neutral-400 before:content-['']">Connected account changes</li>
        </ul>
      </div>
    </div>
  );
}
