"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { RfqStatus } from "@/types/marketplace";

const STATUS_COLORS: Record<RfqStatus, string> = {
  open: "bg-success-light text-success dark:bg-success/20 dark:text-success",
  quotes_received: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  awarded: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  cancelled: "bg-error-light text-error dark:bg-error/20 dark:text-error",
  expired: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

type RfqRow = {
  id: string;
  title: string;
  service_category: string;
  quote_count: number;
  status: RfqStatus;
  created_at: string;
};

const STATUS_FILTERS: (RfqStatus | "all")[] = [
  "all",
  "open",
  "quotes_received",
  "awarded",
  "cancelled",
  "expired",
];

export default function RfqsPage() {
  const [rfqs, setRfqs] = useState<RfqRow[]>([]);
  const [filter, setFilter] = useState<RfqStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/rfq/list${qs}`);
      if (res.ok) {
        const data = await res.json();
        setRfqs(data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My RFQs</h1>
        <Button render={<Link href="/dashboard/rfqs/create" />}>
          <Plus className="size-4" />
          New RFQ
        </Button>
      </div>

      {/* Status Filters */}
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
            {status === "all" ? "All" : status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* RFQ Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : rfqs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <FileText className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No RFQs found. Create one to get quotes from providers.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Quotes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/rfqs/${rfq.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {rfq.title}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {rfq.service_category.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-center">
                      {rfq.quote_count}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent capitalize ${STATUS_COLORS[rfq.status]}`}
                      >
                        {rfq.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(rfq.created_at).toLocaleDateString("en-GB")}
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
