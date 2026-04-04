"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ServiceRequest, Quote, QuoteStatus } from "@/types/marketplace";

type PageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-brand-accent-light text-brand-accent",
  viewed: "bg-brand-accent-light text-brand-accent",
  accepted: "bg-success-light text-success",
  declined: "bg-error-light text-error",
  expired: "bg-neutral-100 text-neutral-600",
  withdrawn: "bg-neutral-100 text-neutral-600",
};

export default function RfqDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [rfq, setRfq] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rfqRes, quotesRes] = await Promise.all([
          fetch(`/api/rfq/${id}`),
          fetch(`/api/rfq/${id}/quotes`).catch(() => null),
        ]);

        if (rfqRes.ok) {
          setRfq(await rfqRes.json());
        }
        if (quotesRes?.ok) {
          const data = await quotesRes.json();
          setQuotes(data.quotes ?? data.data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAcceptQuote(quoteId: string) {
    try {
      const res = await fetch(`/api/rfq/${id}/quotes/${quoteId}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to accept quote");
      toast.success("Quote accepted");
      // Reload
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept quote",
      );
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">RFQ not found.</p>
        <Button
          variant="link"
          render={<Link href="/dashboard/rfqs" />}
          className="mt-2"
        >
          Back to RFQs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard/rfqs" />}>
        <ArrowLeft className="size-4" />
        Back to RFQs
      </Button>

      {/* RFQ Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{rfq.title}</CardTitle>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {rfq.service_category.replace(/_/g, " ")}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {rfq.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {rfq.description}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {rfq.property_postcode}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              Urgency: {rfq.urgency_level}
            </span>
            {rfq.budget_min != null && rfq.budget_max != null && (
              <span>
                Budget: {rfq.budget_min.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
                {" -- "}
                {rfq.budget_max.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Quotes ({quotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No quotes received yet. Providers will be notified about your
              request.
            </p>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Quote #{quote.quote_number}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {quote.total_amount.toLocaleString("en-GB", {
                          style: "currency",
                          currency: "GBP",
                        })}
                        {quote.vat_included && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            inc. VAT
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-transparent capitalize ${QUOTE_STATUS_COLORS[quote.status]}`}
                    >
                      {quote.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {quote.scope_of_work}
                  </p>
                  {quote.estimated_duration && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Est. duration: {quote.estimated_duration}
                    </p>
                  )}
                  {quote.status === "sent" || quote.status === "viewed" ? (
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => handleAcceptQuote(quote.id)}
                    >
                      Accept Quote
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
