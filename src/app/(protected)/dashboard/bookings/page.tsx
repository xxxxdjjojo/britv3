"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import type { BookingStatus } from "@/types/marketplace";

type BookingRow = {
  id: string;
  booking_reference: string;
  service_title: string;
  other_party_name: string;
  scheduled_start_date: string;
  scheduled_end_date: string;
  total_amount: number;
  status: BookingStatus;
};

type StatusCounts = Record<BookingStatus, number>;

const STATUS_TABS: BookingStatus[] = [
  "pending_confirmation",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    pending_confirmation: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    disputed: 0,
  });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeTab !== "all" ? `?status=${activeTab}` : "";
      const res = await fetch(`/api/bookings/list${qs}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings ?? data.data ?? []);
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Bookings</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex items-center gap-2">
            <Calendar className="size-4 text-yellow-600" />
            <div>
              <p className="text-lg font-semibold">{counts.pending_confirmation}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-2">
            <Calendar className="size-4 text-blue-600" />
            <div>
              <p className="text-lg font-semibold">{counts.confirmed}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-2">
            <Package className="size-4 text-orange-600" />
            <div>
              <p className="text-lg font-semibold">{counts.in_progress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-2">
            <Package className="size-4 text-green-600" />
            <div>
              <p className="text-lg font-semibold">{counts.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {STATUS_TABS.map((status) => (
                <TabsTrigger key={status} value={status} className="capitalize">
                  {status.replace(/_/g, " ")}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No bookings found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>With</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/bookings/${booking.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {booking.booking_reference}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {booking.service_title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {booking.other_party_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(
                            booking.scheduled_start_date,
                          ).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.total_amount?.toLocaleString("en-GB", {
                            style: "currency",
                            currency: "GBP",
                          }) ?? "--"}
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={booking.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
