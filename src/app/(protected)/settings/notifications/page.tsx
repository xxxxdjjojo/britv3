"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type NotificationPrefs = {
  email_messages: boolean;
  email_listings: boolean;
  email_viewings: boolean;
  email_marketing: boolean;
  push_messages: boolean;
  push_listings: boolean;
  sms_alerts: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  email_messages: true,
  email_listings: true,
  email_viewings: true,
  email_marketing: false,
  push_messages: true,
  push_listings: false,
  sms_alerts: false,
};

type ChannelToggle = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  key: keyof NotificationPrefs;
};

type NotificationCategory = {
  id: string;
  title: string;
  description: string;
  channels: ChannelToggle[];
};

const CATEGORIES: readonly NotificationCategory[] = [
  {
    id: "messages",
    title: "Messages",
    description: "Alerts when you receive new messages or replies.",
    channels: [
      { label: "Email", icon: Mail, key: "email_messages" },
      { label: "Push", icon: Bell, key: "push_messages" },
    ],
  },
  {
    id: "listings",
    title: "New Listings",
    description: "Notifications for new properties matching your saved searches.",
    channels: [
      { label: "Email", icon: Mail, key: "email_listings" },
      { label: "Push", icon: Bell, key: "push_listings" },
    ],
  },
  {
    id: "viewings",
    title: "Viewings",
    description: "Reminders and updates for scheduled property viewings.",
    channels: [
      { label: "Email", icon: Mail, key: "email_viewings" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "News, promotions, and product updates from Britestate.",
    channels: [
      { label: "Email", icon: Mail, key: "email_marketing" },
    ],
  },
];

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="flex items-center gap-6">
        <div className="h-5 w-16 animate-pulse rounded bg-neutral-100" />
        <div className="h-5 w-16 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/settings/notifications");
        if (!res.ok) throw new Error("Failed to load");
        const data: Partial<NotificationPrefs> = await res.json();
        setPrefs((prev) => ({ ...prev, ...data }));
      } catch {
        // Silently fall back to defaults — user can still interact
      } finally {
        setLoading(false);
      }
    }
    void loadPrefs();
  }, []);

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    const previous = prefs;
    const updated = { ...prefs, [key]: value };

    // Optimistic update
    setPrefs(updated);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Saved", { duration: 2000 });
    } catch {
      // Revert on failure
      setPrefs(previous);
      toast.error("Failed to save. Please try again.");
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

      {/* Email & Push categories */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Email &amp; Push
        </h3>

        <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i < 3 ? "border-b border-neutral-100" : ""
                  }
                >
                  <SkeletonRow />
                </div>
              ))
            : CATEGORIES.map((category, idx) => (
                <div
                  key={category.id}
                  className={
                    idx < CATEGORIES.length - 1
                      ? "border-b border-neutral-100"
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
                    <div className="flex shrink-0 items-center gap-6">
                      {category.channels.map((channel) => {
                        const Icon = channel.icon;
                        const toggleId = `${category.id}-${channel.key}`;
                        return (
                          <div
                            key={channel.key}
                            className="flex items-center gap-2"
                          >
                            <Icon className="size-3.5 text-neutral-400" />
                            <Label
                              htmlFor={toggleId}
                              className="cursor-pointer font-body text-sm text-neutral-600"
                            >
                              {channel.label}
                            </Label>
                            <Switch
                              id={toggleId}
                              checked={prefs[channel.key]}
                              onCheckedChange={(checked) =>
                                handleToggle(channel.key, checked)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* SMS section — visually separated */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
            SMS
          </h3>
          <Badge variant="outline">Coming soon</Badge>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900">
          {loading ? (
            <SkeletonRow />
          ) : (
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-medium text-neutral-900 dark:text-white">
                  SMS Alerts
                </p>
                <p className="font-body text-xs text-neutral-500">
                  Receive time-sensitive alerts via text message.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Smartphone className="size-3.5 text-neutral-400" />
                <Label
                  htmlFor="sms-alerts-toggle"
                  className="cursor-not-allowed font-body text-sm text-neutral-600"
                >
                  SMS
                </Label>
                <Switch
                  id="sms-alerts-toggle"
                  checked={prefs.sms_alerts}
                  onCheckedChange={(checked) =>
                    handleToggle("sms_alerts", checked)
                  }
                  disabled
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
