import { getPricePaidSummary } from "@/services/land-registry/land-registry";
import type { PricePaidRecord } from "@/services/land-registry/types";
import PriceTrendChart from "./PriceTrendChart";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat/Maisonette",
  O: "Other",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAddress(record: PricePaidRecord): string {
  const parts = [record.saon, record.paon, record.street].filter(Boolean);
  return parts.join(", ") || "Address not available";
}

export default async function PriceHistory(
  props: Readonly<{ postcode: string }>,
) {
  const { postcode } = props;
  const summary = await getPricePaidSummary(postcode);

  if (summary.recentSales.length === 0 && summary.areaTrend.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        No price data available for this area
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Area Price History</h3>
        {summary.averagePrice > 0 && (
          <p className="text-sm text-muted-foreground">
            Average price in this area:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(summary.averagePrice)}
            </span>
          </p>
        )}
      </div>

      {summary.areaTrend.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">5-Year Price Trend</h4>
          <PriceTrendChart data={summary.areaTrend} />
        </div>
      )}

      {summary.recentSales.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Recent Sales</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Price</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 font-medium">Address</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentSales.map((sale) => (
                  <tr key={sale.transaction_id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDate(sale.date_of_transfer)}
                    </td>
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">
                      {formatCurrency(sale.price)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {PROPERTY_TYPE_LABELS[sale.property_type] ?? sale.property_type}
                    </td>
                    <td className="py-2">{formatAddress(sale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
