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
import { Link2, Loader2, Unlink } from "lucide-react";
import type { UserIdentity } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_PROVIDERS = ["google", "github"] as const;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
  email: "Email / Password",
};

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectedAccountsCard({
  identities,
  loading,
  unlinkingId,
  onUnlink,
  onLink,
}: Readonly<{
  identities: UserIdentity[];
  loading: boolean;
  unlinkingId: string | null;
  onUnlink: (identityId: string) => void;
  onLink: (provider: string) => void;
}>) {
  const linkedProviders = new Set(identities.map((i) => i.provider));
  const unlinkableProviders = SUPPORTED_PROVIDERS.filter(
    (p) => !linkedProviders.has(p),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5 text-brand-primary" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Link or unlink third-party login providers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading connected accounts...
          </div>
        ) : (
          <>
            {/* Linked providers */}
            {identities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No connected accounts found.
              </p>
            ) : (
              <div className="space-y-2">
                {identities.map((identity) => (
                  <div
                    key={identity.identity_id}
                    className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200/60 dark:bg-neutral-800/50 dark:ring-neutral-700/60"
                  >
                    <Link2 className="size-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {providerLabel(identity.provider)}
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-success/20 text-success text-xs"
                        >
                          Connected
                        </Badge>
                      </div>
                      {identity.identity_data?.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {identity.identity_data.email as string}
                        </p>
                      )}
                    </div>
                    {identity.provider !== "email" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnlink(identity.identity_id)}
                        disabled={unlinkingId === identity.identity_id}
                      >
                        {unlinkingId === identity.identity_id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Unlink className="size-4" />
                        )}
                        <span className="sr-only">Disconnect</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Available providers to link */}
            {unlinkableProviders.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Link another account
                </p>
                <div className="flex flex-wrap gap-2">
                  {unlinkableProviders.map((provider) => (
                    <Button
                      key={provider}
                      variant="outline"
                      size="sm"
                      onClick={() => onLink(provider)}
                    >
                      <Link2 className="size-4 mr-1" />
                      {providerLabel(provider)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
