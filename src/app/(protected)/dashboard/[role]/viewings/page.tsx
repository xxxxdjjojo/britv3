"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, MapPin, Plus, Video } from "lucide-react";
import { useViewings, useCancelViewing } from "@/hooks/useViewings";
import type { ViewingWithDetails } from "@/services/viewings/viewings-service";

const now = new Date();

function isUpcoming(viewing: ViewingWithDetails): boolean {
  const startTime = viewing.viewing_slots?.start_time;
  if (!startTime) return false;
  return (
    (viewing.status === "confirmed" || viewing.status === "rescheduled") &&
    new Date(startTime) > now
  );
}

function isPast(viewing: ViewingWithDetails): boolean {
  const startTime = viewing.viewing_slots?.start_time;
  if (viewing.status === "completed" || viewing.status === "cancelled") {
    return true;
  }
  if (startTime && new Date(startTime) <= now) return true;
  return false;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }: { type: "in_person" | "virtual" }) {
  if (type === "virtual") {
    return (
      <Badge variant="outline" className="gap-1">
        <Video className="size-3" />
        Virtual
      </Badge>
    );
  }
  return <Badge variant="outline">In Person</Badge>;
}

function StatusBadge({ status }: { status: ViewingWithDetails["status"] }) {
  const map: Record<
    ViewingWithDetails["status"],
    "default" | "secondary" | "destructive" | "outline"
  > = {
    confirmed: "default",
    rescheduled: "secondary",
    completed: "default",
    cancelled: "destructive",
  };

  return <Badge variant={map[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-20 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-[120px] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function CancelViewingDialog({ viewingId }: { viewingId: string }) {
  const cancel = useCancelViewing();

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button variant="outline" size="sm" disabled={cancel.isPending}>
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel viewing?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel your viewing appointment. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep viewing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => cancel.mutate({ viewingId })}
          >
            Cancel viewing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ViewingsPage() {
  const { data: viewings, isLoading, isError, refetch } = useViewings();

  const upcomingViewings = (viewings ?? []).filter(isUpcoming);
  const pastViewings = (viewings ?? []).filter(isPast);

  const completedCount = (viewings ?? []).filter(
    (v) => v.status === "completed",
  ).length;

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Viewings</h1>
            <p className="text-muted-foreground">
              Manage your property viewings and appointments
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <p className="text-sm text-muted-foreground">
              Failed to load viewings. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Viewings</h1>
          <p className="text-muted-foreground">
            Manage your property viewings and appointments
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span tabIndex={0}>
                <Button disabled>
                  <Plus className="mr-2 size-4" />
                  Book Viewing
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Contact an agent to book a viewing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Skeleton className="h-9 w-10" />
              ) : (
                upcomingViewings.length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {upcomingViewings.length > 0 && upcomingViewings[0].viewing_slots
                ? `Next: ${formatDateTime(upcomingViewings[0].viewing_slots.start_time)}`
                : "No upcoming viewings"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Skeleton className="h-9 w-10" />
              ) : (
                completedCount
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total viewings completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({isLoading ? "…" : upcomingViewings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({isLoading ? "…" : pastViewings.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming tab */}
        <TabsContent value="upcoming">
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : upcomingViewings.length === 0 ? (
            <EmptyState message="No upcoming viewings. Contact an agent to schedule one." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingViewings.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-medium">
                            {v.viewing_slots?.listings?.address ?? "—"}
                          </div>
                          {v.viewing_slots?.listings?.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {v.viewing_slots.listings.address}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {v.viewing_slots?.start_time ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="size-3 shrink-0" />
                              {formatDateTime(v.viewing_slots.start_time)}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {v.viewing_slots ? (
                            <TypeBadge type={v.viewing_slots.type} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CancelViewingDialog viewingId={v.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Past tab */}
        <TabsContent value="past">
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : pastViewings.length === 0 ? (
            <EmptyState message="No past viewings yet." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastViewings.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">
                          {v.viewing_slots?.listings?.address ?? "—"}
                        </TableCell>
                        <TableCell>
                          {v.viewing_slots?.start_time ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="size-3 shrink-0" />
                              {formatDateTime(v.viewing_slots.start_time)}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {v.viewing_slots ? (
                            <TypeBadge type={v.viewing_slots.type} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
