"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { formatGBP, formatUnixDate } from "@/lib/formatters";

type Invoice = {
  id: string;
  created: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoicePdf: string | null;
  description: string | null;
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    uncollectible: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    void: "bg-muted/60 text-muted-foreground",
  };
  const cls = map[status] ?? "bg-muted/60 text-muted-foreground";
  return (
    <Badge className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function InvoicesPage() {
  const params = useParams<{ role: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/billing/invoices");
      const data = (await res.json()) as { invoices?: Invoice[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load invoices");
      setInvoices(data.invoices ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(invoice: Invoice) {
    if (!invoice.invoicePdf) {
      // Fetch fresh URL
      setRefreshingId(invoice.id);
      try {
        const res = await fetch(`/api/billing/invoices?refresh=${invoice.id}`);
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error("Could not get invoice PDF");
        window.open(data.url, "_blank");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to download invoice");
      } finally {
        setRefreshingId(null);
      }
      return;
    }
    window.open(invoice.invoicePdf, "_blank");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/${params.role}/billing`}>
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Invoices
          </h1>
          <p className="font-body text-sm text-neutral-500">
            Your payment history and downloadable receipts
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <div className="flex items-center gap-2 border-b border-neutral-100/60 p-6 dark:border-neutral-700/60">
          <FileText size={16} className="text-neutral-400" />
          <span className="font-heading text-base font-semibold text-foreground">Payment History</span>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-neutral-400" size={24} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-3 text-neutral-300" size={40} />
              <p className="font-body text-sm text-muted-foreground">No invoices yet.</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Your invoices will appear here after your first payment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-4 transition-colors hover:bg-muted/30">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-foreground">
                      {formatUnixDate(inv.created)}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-neutral-500">
                      {formatGBP(inv.amountPaid, inv.currency)}
                      {inv.description ? ` · ${inv.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(inv.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 font-body text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      onClick={() => void handleDownload(inv)}
                      disabled={refreshingId === inv.id}
                    >
                      {refreshingId === inv.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
