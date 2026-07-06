"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Check, X, MapPin } from "lucide-react";
import type { PendingViewingRequest } from "@/services/viewings/viewings-service";

function formatPreferred(iso: string | null): string {
  if (!iso) return "No preferred time given";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ViewingRequestsPanel({
  requests,
}: Readonly<{ requests: PendingViewingRequest[] }>) {
  const [rows, setRows] = useState(requests);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(id: string, action: "confirm" | "decline") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/viewings/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error("Could not update the request. Please try again.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success(action === "confirm" ? "Viewing confirmed" : "Request declined");
    } catch {
      toast.error("Could not update the request. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-muted-foreground" />
            Viewing requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No pending requests. When a buyer asks to view a property with no open
            slots, it appears here for you to confirm or decline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-[#1B4D3E]" />
          Viewing requests
          <span className="ml-1 rounded-full bg-[#1B4D3E]/10 px-2 py-0.5 text-xs font-semibold text-[#1B4D3E]">
            {rows.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-[#1B4D3E]/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium text-foreground">{r.requester_name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{r.property_address}</span>
              </p>
              <p className="text-sm text-[#1B4D3E]">{formatPreferred(r.preferred_time)}</p>
              {r.notes ? (
                <p className="text-xs text-muted-foreground">&ldquo;{r.notes}&rdquo;</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                disabled={busyId === r.id}
                onClick={() => void respond(r.id, "confirm")}
                className="bg-[#1B4D3E] hover:bg-[#163f33]"
              >
                <Check className="mr-1 size-4" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => void respond(r.id, "decline")}
              >
                <X className="mr-1 size-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
