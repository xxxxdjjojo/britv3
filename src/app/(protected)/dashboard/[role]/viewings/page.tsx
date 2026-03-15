"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useViewings, useCancelViewing } from "@/hooks/useViewings";
import type { Viewing } from "@/services/viewings/viewings-service";

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function statusVariant(
  status: Viewing["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "default";
    case "rescheduled":
      return "secondary";
    case "cancelled":
      return "destructive";
    case "completed":
      return "outline";
    default:
      return "secondary";
  }
}

function statusLabel(status: Viewing["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const ACTIVE_STATUSES = new Set<Viewing["status"]>(["confirmed", "rescheduled"]);
const PAST_STATUSES = new Set<Viewing["status"]>(["completed", "cancelled"]);

export default function ViewingsPage({
  params,
}: Readonly<{ params: { role: string } }>) {
  const { role } = params;
  const { data: viewings, isLoading, error } = useViewings();
  const cancelViewing = useCancelViewing();

  const upcoming = viewings?.filter((v) => ACTIVE_STATUSES.has(v.status)) ?? [];
  const past = viewings?.filter((v) => PAST_STATUSES.has(v.status)) ?? [];

  const nextViewing = upcoming.sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )[0];

  const handleCancel = async (viewingId: string) => {
    try {
      await cancelViewing.mutateAsync({ viewingId });
      toast.success("Viewing cancelled");
    } catch {
      toast.error("Failed to cancel viewing");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Viewings</h1>
          <p className="text-muted-foreground">
            Manage your property viewings and appointments
          </p>
        </div>
        <Link href={`/dashboard/${role}/viewings/book`}>
          <Button>
            <Plus className="mr-2 size-4" />
            Book Viewing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl">{upcoming.length}</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {nextViewing
                ? `Next: ${formatDate(nextViewing.scheduled_at)}`
                : "No upcoming viewings"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl">
                {past.filter((v) => v.status === "completed").length}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total past viewings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>All Time</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl">{viewings?.length ?? 0}</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total viewings arranged</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Failed to load viewings. Please refresh the page.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : upcoming.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto mb-4 size-12 opacity-40" />
                  <p className="text-base font-medium">No upcoming viewings</p>
                  <p className="mt-1 text-sm">
                    Book a viewing to get started.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-medium">{v.property_address}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {v.property_address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDate(v.scheduled_at)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {formatTime(v.scheduled_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {v.type === "virtual" ? (
                              <>
                                <Video className="mr-1 size-3" />
                                Virtual
                              </>
                            ) : (
                              "In Person"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(v.status)}>
                            {statusLabel(v.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/dashboard/${role}/viewings/${v.id}/reschedule`}
                            >
                              <Button variant="outline" size="sm">
                                <RotateCcw className="mr-1 size-3" />
                                Reschedule
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(v.id)}
                              disabled={cancelViewing.isPending}
                            >
                              <X className="mr-1 size-3" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : past.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-4 size-12 opacity-40" />
                  <p className="text-base font-medium">No past viewings</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {past.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">
                          {v.property_address}
                        </TableCell>
                        <TableCell>{formatDate(v.scheduled_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {v.type === "virtual" ? "Virtual" : "In Person"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(v.status)}>
                            {statusLabel(v.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
