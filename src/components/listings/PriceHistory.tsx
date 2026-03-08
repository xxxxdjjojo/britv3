import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PriceHistory as PriceHistoryType } from "@/types/property";
import { ArrowDown, ArrowUp } from "lucide-react";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function PriceHistory(
  props: Readonly<{ history: PriceHistoryType[] }>,
) {
  if (props.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-900">
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            No price changes recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-900">
          Price History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {props.history.map((entry) => {
            const diff = entry.new_price - entry.old_price;
            const pctChange = ((diff / entry.old_price) * 100).toFixed(1);
            const isIncrease = diff > 0;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-xs text-neutral-400">
                    {formatDate(entry.changed_at)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {formatPrice(entry.old_price)} &rarr;{" "}
                    <span className="font-medium text-neutral-900">
                      {formatPrice(entry.new_price)}
                    </span>
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    isIncrease ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isIncrease ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  {isIncrease ? "+" : ""}
                  {pctChange}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
