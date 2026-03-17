"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationKey =
  | "email_messages"
  | "email_listings"
  | "email_viewings"
  | "email_marketing"
  | "push_messages"
  | "push_listings"
  | "sms_alerts";

type NotificationPreferences = Partial<Record<NotificationKey, boolean>>;

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchPreferences(): Promise<NotificationPreferences> {
  const res = await fetch("/api/settings/notifications");
  if (!res.ok) throw new Error("Failed to fetch preferences");
  return res.json() as Promise<NotificationPreferences>;
}

async function savePreference(
  update: Partial<Record<NotificationKey, boolean>>,
): Promise<NotificationPreferences> {
  const res = await fetch("/api/settings/notifications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error("Failed to save preference");
  return res.json() as Promise<NotificationPreferences>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleSkeleton() {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-5 w-9 rounded-full" />
    </div>
  );
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-52" />
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="py-4 first:pt-0 last:pb-0">
            <ToggleSkeleton />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  prefKey: NotificationKey;
  checked: boolean;
  disabled?: boolean;
  onToggle: (key: NotificationKey, value: boolean) => void;
}

function ToggleRow({
  label,
  description,
  prefKey,
  checked,
  disabled = false,
  onToggle,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onToggle(prefKey, value)}
        aria-label={label}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const {
    data: prefs,
    isLoading,
    isError,
  } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: fetchPreferences,
  });

  const mutation = useMutation<
    NotificationPreferences,
    Error,
    { key: NotificationKey; value: boolean },
    NotificationPreferences
  >({
    mutationFn: ({ key, value }) => savePreference({ [key]: value }),
    onMutate: async ({ key, value }) => {
      // Cancel any in-flight queries to prevent overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: ["notification-preferences"] });

      // Snapshot the previous value (returned as context for rollback)
      const previousPrefs =
        queryClient.getQueryData<NotificationPreferences>(["notification-preferences"]) ?? {};

      // Optimistically update
      queryClient.setQueryData<NotificationPreferences>(
        ["notification-preferences"],
        (old) => ({ ...old, [key]: value }),
      );

      return previousPrefs;
    },
    onError: (_err, _vars, context) => {
      // Revert to previous value
      if (context !== undefined) {
        queryClient.setQueryData(["notification-preferences"], context);
      }
      toast.error("Failed to save preference");
    },
    onSuccess: () => {
      toast.success("Preference saved");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  function handleToggle(key: NotificationKey, value: boolean) {
    mutation.mutate({ key, value });
  }

  function pref(key: NotificationKey): boolean {
    return prefs?.[key] ?? false;
  }

  const isPending = mutation.isPending;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card>
          <CardContent className="flex min-h-[120px] items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              Failed to load notification preferences. Please refresh the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* Email Notifications */}
      {isLoading ? (
        <SectionSkeleton rows={4} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-muted-foreground" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Control which emails Britestate sends to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="New Property Matches"
              description="Get emails when new properties match your saved searches"
              prefKey="email_listings"
              checked={pref("email_listings")}
              disabled={isPending}
              onToggle={handleToggle}
            />
            <ToggleRow
              label="Viewing Reminders"
              description="Receive reminders before your scheduled viewings"
              prefKey="email_viewings"
              checked={pref("email_viewings")}
              disabled={isPending}
              onToggle={handleToggle}
            />
            <ToggleRow
              label="Messages"
              description="Email alerts when you receive a new message"
              prefKey="email_messages"
              checked={pref("email_messages")}
              disabled={isPending}
              onToggle={handleToggle}
            />
            <ToggleRow
              label="Marketing & Updates"
              description="News, tips, and product updates from Britestate"
              prefKey="email_marketing"
              checked={pref("email_marketing")}
              disabled={isPending}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>
      )}

      {/* Push Notifications */}
      {isLoading ? (
        <SectionSkeleton rows={2} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-muted-foreground" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              In-app and browser push alerts for time-sensitive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Property Alerts"
              description="Instant notifications for new matching properties"
              prefKey="push_listings"
              checked={pref("push_listings")}
              disabled={isPending}
              onToggle={handleToggle}
            />
            <ToggleRow
              label="Message Notifications"
              description="Get notified when someone messages you"
              prefKey="push_messages"
              checked={pref("push_messages")}
              disabled={isPending}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>
      )}

      {/* SMS Alerts */}
      {isLoading ? (
        <SectionSkeleton rows={1} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-4 text-muted-foreground" />
              SMS Alerts
            </CardTitle>
            <CardDescription>
              Text messages for important account activity
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="SMS Alerts"
              description="Text message alerts for important updates"
              prefKey="sms_alerts"
              checked={pref("sms_alerts")}
              disabled={isPending}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>
      )}

      {/* Informational note */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4">
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Changes are saved automatically. Transactional emails related to your
          account security and legal notices cannot be disabled.
        </p>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
      <p className="text-muted-foreground">
        Choose how and when you hear from us
      </p>
    </div>
  );
}
