"use client";

import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { cn } from "@/lib/utils";
import type { Quote, QuoteLineItem } from "@/types/marketplace";

type QuoteWithProvider = Quote & {
  provider_name: string;
  provider_rating: number;
  provider_review_count: number;
};

type QuoteComparisonProps = Readonly<{
  quotes: QuoteWithProvider[];
  onAccept?: (quoteId: string) => void;
  className?: string;
}>;

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function findExtremes(quotes: QuoteWithProvider[]) {
  if (quotes.length < 2) return { cheapestId: null, expensiveId: null };
  let cheapest = quotes[0];
  let expensive = quotes[0];
  for (const q of quotes) {
    if (q.total_amount < cheapest.total_amount) cheapest = q;
    if (q.total_amount > expensive.total_amount) expensive = q;
  }
  return { cheapestId: cheapest.id, expensiveId: expensive.id };
}

function LineItemsTable({ items }: Readonly<{ items: QuoteLineItem[] }>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, i) => (
          <TableRow key={i}>
            <TableCell className="whitespace-normal">{item.description}</TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
            <TableCell className="text-right">{gbp.format(item.unit_price)}</TableCell>
            <TableCell className="text-right">{gbp.format(item.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function QuoteColumn({
  quote,
  isCheapest,
  isExpensive,
  onAccept,
}: Readonly<{
  quote: QuoteWithProvider;
  isCheapest: boolean;
  isExpensive: boolean;
  onAccept?: (quoteId: string) => void;
}>) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    onAccept?.(quote.id);
  };

  return (
    <Card
      className={cn(
        "flex flex-col",
        isCheapest && "ring-2 ring-success/50",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{quote.provider_name}</CardTitle>
          {isCheapest && (
            <Badge variant="secondary" className="shrink-0 bg-success-light text-success">
              Best value
            </Badge>
          )}
          {isExpensive && (
            <Badge variant="outline" className="shrink-0">
              Highest
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <RatingStars rating={quote.provider_rating} size="sm" />
          <span className="text-xs text-muted-foreground">
            ({quote.provider_review_count})
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Total */}
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            {gbp.format(quote.total_amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {quote.vat_included ? "VAT included" : "Excl. VAT"}
          </p>
        </div>

        {/* Line items */}
        <LineItemsTable items={quote.line_items} />

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-foreground">Scope</span>
            <p className="mt-0.5 line-clamp-3 text-muted-foreground">
              {quote.scope_of_work}
            </p>
          </div>
          {quote.estimated_duration && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{quote.estimated_duration}</span>
            </div>
          )}
          {quote.warranty_info && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warranty</span>
              <span className="font-medium">{quote.warranty_info}</span>
            </div>
          )}
          {quote.payment_terms && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">{quote.payment_terms}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAccept}
          disabled={accepting || quote.status !== "sent"}
          className="w-full"
        >
          {accepting ? (
            <Check className="animate-pulse" />
          ) : (
            "Accept Quote"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function QuoteComparison({
  quotes,
  onAccept,
  className,
}: QuoteComparisonProps) {
  const displayQuotes = quotes.slice(0, 3);
  const { cheapestId, expensiveId } = findExtremes(displayQuotes);

  if (displayQuotes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center gap-2 rounded-lg border border-dashed p-8", className)}>
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No quotes to compare yet.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold text-foreground">
        Compare Quotes ({displayQuotes.length})
      </h2>
      <div
        className={cn(
          "grid gap-4",
          displayQuotes.length === 1 && "grid-cols-1 max-w-md",
          displayQuotes.length === 2 && "grid-cols-1 md:grid-cols-2",
          displayQuotes.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {displayQuotes.map((quote) => (
          <QuoteColumn
            key={quote.id}
            quote={quote}
            isCheapest={quote.id === cheapestId}
            isExpensive={quote.id === expensiveId}
            onAccept={onAccept}
          />
        ))}
      </div>
    </div>
  );
}
