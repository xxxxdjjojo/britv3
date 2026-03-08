"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notifications";
import type { NotificationPreferences as NotifPrefs, EventType, DigestFrequency } from "@/types/notifications";

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  new_message: "New Message",
  quote_received: "Quote Received",
  quote_sent: "Quote Sent",
  booking_confirmed: "Booking Confirmed",
  booking_updated: "Booking Updated",
  milestone_updated: "Milestone Updated",
  offer_received: "Offer Received",
  viewing_scheduled: "Viewing Scheduled",
  review_posted: "Review Posted",
};

const ALL_EVENT_TYPES: EventType[] = Object.keys(EVENT_TYPE_LABELS) as EventType[];

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (!res.ok) throw new Error("Failed to load preferences");
        const { data } = await res.json();
        setPrefs(data);
      } catch {
        toast.error("Failed to load notification preferences");
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, []);

  const savePrefs = useCallback(async (updated: NotifPrefs) => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to save");
      }

      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }, []);

  function debouncedSave(updated: NotifPrefs) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => savePrefs(updated), 500);
  }

  function toggleChannel(eventType: EventType, channel: "in_app" | "email") {
    setPrefs((prev) => {
      const current = prev.per_type[eventType] ?? { in_app: true, email: false };
      const updated: NotifPrefs = {
        ...prev,
        per_type: {
          ...prev.per_type,
          [eventType]: {
            ...current,
            [channel]: !current[channel],
          },
        },
      };
      debouncedSave(updated);
      return updated;
    });
  }

  function setQuietHours(field: "enabled" | "start" | "end", value: boolean | string) {
    setPrefs((prev) => {
      const updated: NotifPrefs = {
        ...prev,
        quiet_hours: {
          ...prev.quiet_hours,
          [field]: value,
        },
      };
      debouncedSave(updated);
      return updated;
    });
  }

  function setDigestFrequency(value: DigestFrequency) {
    setPrefs((prev) => {
      const updated: NotifPrefs = {
        ...prev,
        digest_frequency: value,
      };
      debouncedSave(updated);
      return updated;
    });
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        {saving && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      {/* Per-type toggles */}
      <div className="mb-6">
        <div className="mb-2 grid grid-cols-[1fr_64px_64px] gap-2 text-sm font-medium text-muted-foreground">
          <span>Event Type</span>
          <span className="text-center">In-App</span>
          <span className="text-center">Email</span>
        </div>
        <div className="space-y-3">
          {ALL_EVENT_TYPES.map((eventType) => {
            const current = prefs.per_type[eventType] ?? { in_app: true, email: false };
            return (
              <div
                key={eventType}
                className="grid grid-cols-[1fr_64px_64px] items-center gap-2"
              >
                <span className="text-sm">{EVENT_TYPE_LABELS[eventType]}</span>
                <div className="flex justify-center">
                  <Switch
                    checked={current.in_app}
                    onCheckedChange={() => toggleChannel(eventType, "in_app")}
                    size="sm"
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={current.email}
                    onCheckedChange={() => toggleChannel(eventType, "email")}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-6 space-y-3">
        <h3 className="font-medium">Quiet Hours</h3>
        <div className="flex items-center gap-3">
          <Switch
            checked={prefs.quiet_hours.enabled}
            onCheckedChange={(val) => setQuietHours("enabled", val)}
          />
          <Label>Enable quiet hours</Label>
        </div>
        {prefs.quiet_hours.enabled && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">From</Label>
            <Input
              type="time"
              value={prefs.quiet_hours.start}
              onChange={(e) => setQuietHours("start", e.target.value)}
              className="w-28"
            />
            <Label className="text-sm">to</Label>
            <Input
              type="time"
              value={prefs.quiet_hours.end}
              onChange={(e) => setQuietHours("end", e.target.value)}
              className="w-28"
            />
          </div>
        )}
      </div>

      {/* Digest Frequency */}
      <div className="space-y-2">
        <h3 className="font-medium">Email Digest</h3>
        <Select
          value={prefs.digest_frequency}
          onValueChange={(val) => setDigestFrequency(val as DigestFrequency)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="never">Never</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Explicit save button as fallback */}
      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => savePrefs(prefs)}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save All Preferences
        </Button>
      </div>
    </Card>
  );
}
