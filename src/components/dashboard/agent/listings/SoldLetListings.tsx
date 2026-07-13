
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

type Props = Readonly<{
  listings: Record<string, unknown>[];
}>;

function formatGbp(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStr(listing: Record<string, unknown>, key: string): string {
  const v = listing[key];
  return typeof v === "string" ? v : "";
}

function getNum(listing: Record<string, unknown>, key: string): number {
  const v = listing[key];
  return typeof v === "number" ? v : 0;
}

function calcDaysOnMarket(listing: Record<string, unknown>): number {
  const created = getStr(listing, "created_at");
  const updated = getStr(listing, "updated_at");
  if (!created || !updated) return 0;
  const diff = new Date(updated).getTime() - new Date(created).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function SoldLetListings({ listings }: Props) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Sold & Let Listings ({listings.length})
      </h1>

      {listings.length === 0 && (
        <p className="text-muted-foreground text-sm">No sold or let listings found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => {
          const id = getStr(listing, "id");
          const title = getStr(listing, "title") || getStr(listing, "address_line_1") || "Untitled";
          const price = getNum(listing, "price");
          const status = getStr(listing, "status");
          const imageUrl = getStr(listing, "primary_image_url");
          const completionDate = getStr(listing, "completion_date") || getStr(listing, "updated_at");
          const daysOnMarket = calcDaysOnMarket(listing);
          const commission = getNum(listing, "commission_amount");
          const isSold = status === "sold";
          const badgeLabel = isSold ? "SOLD" : "LET";
          const badgeClass = isSold
            ? "bg-red-600 text-white"
            : "bg-green-600 text-white";

          return (
            <Card key={id} className="overflow-hidden">
              <div className="relative h-48 bg-muted">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full uppercase ${badgeClass}`}
                >
                  {badgeLabel}
                </span>
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="font-medium text-sm line-clamp-2">{title}</p>
                <p className="text-lg font-bold text-foreground">{formatGbp(price)}</p>
                {completionDate && (
                  <p className="text-xs text-muted-foreground">
                    Completed:{" "}
                    {new Date(completionDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {daysOnMarket} day{daysOnMarket !== 1 ? "s" : ""} on market
                </p>
                {commission > 0 && (
                  <span className="inline-block text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    Commission: {formatGbp(commission)}
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
