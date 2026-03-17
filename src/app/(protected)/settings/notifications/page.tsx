"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NEW_DEFAULTS } from "@/lib/settings/notification-prefs";

type NotificationPrefs = Record<string, boolean>;

type ChannelToggle = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  key: string;
};

type NotificationCategory = {
  id: string;
  title: string;
  description: string;
  channels: ChannelToggle[];
};

const CATEGORIES: readonly NotificationCategory[] = [
  {
    id: "property_alerts",
    title: "Property Alerts",
    description: "Notifications for new properties matching your saved searches.",
    channels: [
      { label: "Email", icon: Mail, key: "property_alerts_email" },
      { label: "Push", icon: Bell, key: "property_alerts_push" },
      { label: "SMS", icon: Smartphone, key: "property_alerts_sms" },
      { label: "In-App", icon: MessageSquare, key: "property_alerts_inapp" },
    ],
  },
  {
    id: "viewings",
    title: "Viewings",
    description: "Reminders and updates for scheduled property viewings.",
    channels: [
      { label: "Email", icon: Mail, key: "viewings_email" },
      { label: "Push", icon: Bell, key: "viewings_push" },
      { label: "SMS", icon: Smartphone, key: "viewings_sms" },
      { label: "In-App", icon: MessageSquare, key: "viewings_inapp" },
    ],
  },
  {
    id: "offers",
    title: "Offers",
    description: "Updates on offers you've made or received.",
    channels: [
      { label: "Email", icon: Mail, key: "offers_email" },
      { label: "Push", icon: Bell, key: "offers_push" },
      { label: "SMS", icon: Smartphone, key: "offers_sms" },
      { label: "In-App", icon: MessageSquare, key: "offers_inapp" },
    ],
  },
  {
    id: "messages",
    title: "Messages",
    description: "Alerts when you receive new messages or replies.",
    channels: [
      { label: "Email", icon: Mail, key: "messages_email" },
      { label: "Push", icon: Bell, key: "messages_push" },
      { label: "SMS", icon: Smartphone, key: "messages_sms" },
      { label: "In-App", icon: MessageSquare, key: "messages_inapp" },
    ],
  },
  {
    id: "market_reports",
    title: "Market Reports",
    description: "Periodic market insights and price trend reports.",
    channels: [
      { label: "Email", icon: Mail, key: "market_reports_email" },
      { label: "Push", icon: Bell, key: "market_reports_push" },
      { label: "SMS", icon: Smartphone, key: "market_reports_sms" },
      { label: "In-App", icon: MessageSquare, key: "market_reports_inapp" },
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
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...NEW_DEFAULTS });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/settings/notifications");
        if (!res.ok) throw new Error("Failed to load");
        const data: NotificationPrefs = await res.json();
        setPrefs((prev) => ({ ...prev, ...data }));
      } catch {
        // Silently fall back to defaults — user can still interact
      } finally {
        setLoading(false);
      }
    }
    void loadPrefs();
  }, []);

  async function handleToggle(key: string, value: boolean) {
    // Optimistic update
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
      // Revert single key on failure
      setPrefs((prev) => ({ ...prev, [key]: !value }));
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

      {/* Notification categories */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
          Notification Preferences
        </h3>

        <div className="rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i < 4 ? "border-b border-neutral-100" : ""
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
                              checked={prefs[channel.key] ?? false}
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
    </div>
  );
}
