
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Loader2, Info } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginHistoryEntry = {
  id: string;
  created_at: string;
  ip_address: string | null;
  action: string;
  user_agent: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  } catch {
    return "Unknown";
  }
}

function friendlyAction(action: string): string {
  const map: Record<string, string> = {
    login: "Login",
    logout: "Logout",
    token_refreshed: "Token Refreshed",
    token_revoked: "Token Revoked",
    user_signedup: "Sign Up",
    user_invited: "Invited",
    user_deleted: "Deleted",
    user_updated: "Updated",
  };
  return map[action] ?? action;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "login" || action === "user_signedup") return "default";
  if (action === "logout" || action === "token_revoked" || action === "user_deleted") return "destructive";
  return "secondary";
}

function friendlyUserAgent(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown device";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginHistoryTable({
  entries,
  loading,
  fallback,
}: Readonly<{
  entries: LoginHistoryEntry[];
  loading: boolean;
  fallback: boolean;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-brand-primary" />
          Login History
        </CardTitle>
        <CardDescription>
          Recent sign-in activity on your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading login history...
          </div>
        ) : fallback ? (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Info className="size-4 shrink-0" />
            Login history is not available for your account at this time.
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No login history found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Device</th>
                  <th className="pb-2 pr-4 font-medium">IP Address</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {friendlyUserAgent(entry.user_agent)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                      {entry.ip_address ?? "—"}
                    </td>
                    <td className="py-2">
                      <Badge variant={actionVariant(entry.action)} className="text-xs">
                        {friendlyAction(entry.action)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
