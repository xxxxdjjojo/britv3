"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Smartphone,
  Laptop,
  LogOut,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deviceIcon(userAgent?: string) {
  if (!userAgent) return <Monitor className="size-5 text-muted-foreground" />;
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) {
    return <Smartphone className="size-5 text-muted-foreground" />;
  }
  if (/macintosh|windows|linux/.test(ua)) {
    return <Laptop className="size-5 text-muted-foreground" />;
  }
  return <Monitor className="size-5 text-muted-foreground" />;
}

function friendlyUserAgent(userAgent?: string): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown device";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  } catch {
    return "Unknown";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionInfo = {
  id: string;
  user_agent?: string;
  created_at?: string;
  last_sign_in_at?: string;
  ip?: string;
  is_current: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActiveSessionsList({
  sessions,
  sessionsLoading,
  signingOut,
  signingOutSession,
  onSignOutAll,
  onSignOutSession,
}: Readonly<{
  sessions: SessionInfo[];
  sessionsLoading: boolean;
  signingOut: boolean;
  signingOutSession: string | null;
  onSignOutAll: () => void;
  onSignOutSession: (sessionId: string) => void;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="size-5 text-brand-primary" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions across all devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Monitor className="size-5 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium">Current Device</p>
              <p className="text-xs text-muted-foreground">
                You are currently signed in on this device
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {deviceIcon(session.user_agent)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {friendlyUserAgent(session.user_agent)}
                    </p>
                    {session.is_current && (
                      <Badge
                        variant="secondary"
                        className="bg-success/20 text-success text-xs"
                      >
                        Current session
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session.last_sign_in_at
                      ? `Last active ${formatDate(session.last_sign_in_at)}`
                      : `Started ${formatDate(session.created_at)}`}
                  </p>
                </div>
                {!session.is_current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSignOutSession(session.id)}
                    disabled={signingOutSession === session.id}
                  >
                    {signingOutSession === session.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    <span className="sr-only">Sign out this session</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={onSignOutAll}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sign Out of All Devices
        </Button>
      </CardContent>
    </Card>
  );
}
