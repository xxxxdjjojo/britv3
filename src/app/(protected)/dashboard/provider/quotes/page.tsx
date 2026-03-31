"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Plus, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QuoteStatus } from "@/types/marketplace";

type QuoteRow = {
  id: string;
  quote_number: string;
  rfq_title: string;
  rfq_id: string;
  total_amount: number;
  status: QuoteStatus;
  created_at: string;
};

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  sent: "bg-info-light text-info dark:bg-info/10 dark:text-info",
  viewed: "bg-info-light text-info dark:bg-info/10 dark:text-info",
  accepted:
    "bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/20 dark:text-green-300",
  declined: "bg-error-light text-error dark:bg-error/10 dark:text-error",
  expired:
    "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  withdrawn:
    "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const STATUS_FILTERS: (QuoteStatus | "all")[] = [
  "all",
  "draft",
  "sent",
  "viewed",
  "accepted",
  "declined",
];

export default function ProviderQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/providers/quotes${qs}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes ?? data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Derived metrics
  const outstanding = quotes
    .filter((q) => q.status === "sent" || q.status === "viewed")
    .reduce((sum, q) => sum + q.total_amount, 0);

  const acceptedCount = quotes.filter((q) => q.status === "accepted").length;
  const sentCount = quotes.filter(
    (q) => q.status === "sent" || q.status === "accepted" || q.status === "declined",
  ).length;
  const conversionRate =
    sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Quotes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track all your client quotes.
          </p>
        </div>
        <Link
          href="/dashboard/provider/quotes/builder"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light"
          aria-label="Create new quote"
        >
          <Plus className="size-4" />
          New Quote
        </Link>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Outstanding */}
        <div className="rounded-2xl bg-brand-primary p-6 text-white">
          <p className="text-sm font-medium text-white/70">Outstanding Value</p>
          <p className="mt-2 font-heading text-3xl font-bold">
            {outstanding.toLocaleString("en-GB", {
              style: "currency",
              currency: "GBP",
            })}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
            Awaiting client decision
          </p>
        </div>

        {/* Conversion rate */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-brand-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </p>
          </div>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">
            {conversionRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {acceptedCount} of {sentCount} sent quotes accepted
          </p>
        </div>

        {/* Total quotes */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </p>
          </div>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">
            {quotes.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Across all statuses</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter quotes by status"
      >
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === status
                ? "border-brand-primary bg-brand-primary-lighter text-brand-primary"
                : "border-border text-muted-foreground hover:border-brand-primary/40 hover:text-foreground"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Submitted Quotes
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div
              className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"
              aria-label="Loading quotes"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Loading quotes…
            </p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No quotes yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first quote to get started.
              </p>
            </div>
            <Link
              href="/dashboard/provider/quotes/builder"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light"
            >
              <Plus className="size-4" />
              Create Quote
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
                    Quote #
                  </TableHead>
                  <TableHead className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
                    RFQ / Property
                  </TableHead>
                  <TableHead className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="font-medium text-foreground">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/rfqs/${quote.rfq_id}`}
                        className="font-medium text-brand-accent hover:underline"
                      >
                        {quote.rfq_title}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {quote.total_amount.toLocaleString("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent capitalize text-xs font-medium ${STATUS_STYLES[quote.status]}`}
                      >
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {quote.status === "accepted" && (
                        <Link
                          href={`/dashboard/provider/quotes/${quote.id}/invoice`}
                          className="text-xs font-medium text-brand-accent hover:underline"
                          aria-label={`Generate invoice for quote ${quote.quote_number}`}
                        >
                          Invoice
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
