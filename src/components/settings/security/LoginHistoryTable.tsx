"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LoginHistoryEntry = {
  id: string;
  ip_address: string | null;
  created_at: string;
  payload: Record<string, unknown> | null;
};

type LoginHistoryTableProps = Readonly<{
  entries: LoginHistoryEntry[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
}>;

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

function extractEventType(payload: Record<string, unknown> | null): string {
  if (!payload) return "Unknown";

  // Supabase stores the action in the "action" field of the payload
  const action = payload.action as string | undefined;
  if (action) {
    // Transform snake_case action into human-readable label
    const labels: Record<string, string> = {
      login: "Sign in",
      signup: "Sign up",
      logout: "Sign out",
      token_refreshed: "Token refresh",
      token_revoked: "Token revoked",
      user_updated: "Account updated",
      user_deleted: "Account deleted",
      user_recovery: "Password recovery",
      user_invited: "Invitation",
      user_repeated_signup: "Repeated sign-up",
      user_confirmation_requested: "Email confirmation",
    };
    return labels[action] ?? action.replace(/_/g, " ");
  }

  // Fallback: check method or other fields
  const method = payload.method as string | undefined;
  if (method) return method;

  return "Auth event";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginHistoryTable({
  entries,
  total,
  page,
  perPage,
  loading,
  error,
  onPageChange,
}: LoginHistoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-brand-primary" />
          Login History
        </CardTitle>
        <CardDescription>
          Recent authentication events for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Error / unavailable state */}
        {error && !loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            Login history is temporarily unavailable.
          </div>
        ) : loading ? (
          /* Loading skeleton */
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          /* Empty state */
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <History className="size-4 shrink-0" />
            No login history available.
          </div>
        ) : (
          /* Table */
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {entry.ip_address ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {extractEventType(entry.payload)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} ({total} events)
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrev}
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNext}
                  >
                    <ChevronRight className="size-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
