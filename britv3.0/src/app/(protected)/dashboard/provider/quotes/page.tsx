"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-cyan-100 text-cyan-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-neutral-100 text-neutral-600",
  withdrawn: "bg-neutral-100 text-neutral-600",
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Quotes</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === status
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <FileText className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No quotes submitted yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>RFQ</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/rfqs/${quote.rfq_id}`}
                        className="text-primary hover:underline"
                      >
                        {quote.rfq_title}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {quote.total_amount.toLocaleString("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent capitalize ${STATUS_COLORS[quote.status]}`}
                      >
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString("en-GB")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
