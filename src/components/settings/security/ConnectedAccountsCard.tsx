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
import { Link2, Unlink, Loader2, AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Identity = {
  id: string;
  provider: string;
  identity_data?: Record<string, unknown>;
  created_at?: string;
};

type ConnectedAccountsCardProps = Readonly<{
  identities: Identity[];
  loading: boolean;
  error: string | null;
  disconnecting: string | null;
  onDisconnect: (identityId: string) => void;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function providerDisplayName(provider: string): string {
  const names: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    apple: "Apple",
    facebook: "Facebook",
    twitter: "Twitter",
    discord: "Discord",
    linkedin: "LinkedIn",
    azure: "Microsoft",
    email: "Email / Password",
  };
  return names[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

function providerEmail(identity: Identity): string | null {
  const email = identity.identity_data?.email;
  return typeof email === "string" ? email : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectedAccountsCard({
  identities,
  loading,
  error,
  disconnecting,
  onDisconnect,
}: ConnectedAccountsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5 text-brand-primary" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Manage third-party accounts linked to your Britestate login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading connected accounts...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Unable to load connected accounts. Please try again later.</span>
          </div>
        ) : identities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No connected accounts. You can link a third-party provider from your
            login screen.
          </p>
        ) : (
          <div className="space-y-2">
            {identities.map((identity) => (
              <div
                key={identity.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Link2 className="size-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {providerDisplayName(identity.provider)}
                    </p>
                    {identity.provider === "email" && (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        Password
                      </Badge>
                    )}
                  </div>
                  {providerEmail(identity) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {providerEmail(identity)}
                    </p>
                  )}
                </div>
                {identity.provider !== "email" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDisconnect(identity.id)}
                    disabled={disconnecting === identity.id}
                  >
                    {disconnecting === identity.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Unlink className="size-4" />
                    )}
                    Disconnect
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
