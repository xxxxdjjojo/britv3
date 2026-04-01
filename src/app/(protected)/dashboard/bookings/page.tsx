"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { cn } from "@/lib/utils";
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
      <h1 className="font-heading text-xl font-semibold text-foreground">Bookings</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20">
              <Calendar className="size-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">{counts.pending_confirmation}</p>
              <p className="font-body text-xs text-neutral-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
              <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">{counts.confirmed}</p>
              <p className="font-body text-xs text-neutral-500">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
              <Package className="size-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">{counts.in_progress}</p>
              <p className="font-body text-xs text-neutral-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
              <Package className="size-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">{counts.completed}</p>
              <p className="font-body text-xs text-neutral-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden">
        <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">All Bookings</h2>
        </div>
        <div className="px-6 pt-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-neutral-100/60 dark:border-neutral-700/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium capitalize transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2",
                activeTab === "all"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-neutral-500 hover:text-foreground",
              )}
            >
              All
            </button>
            {STATUS_TABS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium capitalize transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2",
                  activeTab === status
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-neutral-500 hover:text-foreground",
                )}
              >
                {status.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="py-4">
            {loading ? (
              <div className="py-8 text-center font-body text-sm text-neutral-500">
                Loading...
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-8 text-center font-body text-sm text-neutral-500">
                No bookings found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">With</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dates</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="border-neutral-100/60 transition-colors hover:bg-muted/30 dark:border-neutral-700/60"
                    >
                      <TableCell>
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="font-body text-sm font-medium text-brand-primary hover:underline"
                        >
                          {booking.booking_reference}
                        </Link>
                      </TableCell>
                      <TableCell className="font-body text-sm text-neutral-500">
                        {booking.service_title}
                      </TableCell>
                      <TableCell className="font-body text-sm text-neutral-500">
                        {booking.other_party_name}
                      </TableCell>
                      <TableCell className="font-body text-sm text-neutral-500">
                        {new Date(
                          booking.scheduled_start_date,
                        ).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="font-body text-sm font-medium text-foreground">
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
          </div>
        </div>
      </div>
    </div>
  );
}
