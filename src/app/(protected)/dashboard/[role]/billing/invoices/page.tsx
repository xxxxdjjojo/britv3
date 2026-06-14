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
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    uncollectible: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    void: "bg-muted text-muted-foreground dark:bg-gray-800 dark:text-gray-300",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <Badge className={`${cls} text-xs`}>
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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/${params.role}/billing`}>
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h1
            className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Invoices
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your payment history and downloadable receipts
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={16} className="text-gray-400" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-500">No invoices yet.</p>
              <p className="mt-1 text-xs text-gray-400">
                Your invoices will appear here after your first payment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatUnixDate(inv.created)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatGBP(inv.amountPaid, inv.currency)}
                      {inv.description ? ` · ${inv.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(inv.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
        </CardContent>
      </Card>
    </div>
  );
}
