/**
 * RecentSalesList — the actual registered sales for one postcode, straight
 * from HM Land Registry Price Paid Data. Real rows only: date, address,
 * property type, price. Self-gating: renders nothing when there are no sales.
 * Server-safe (no state, no effects).
 */

import type { RecentSale } from "@/services/truedeed/ppd-postcode-service";

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPrice(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB")}`;
}

export function RecentSalesList({
  postcode,
  sales,
}: Readonly<{ postcode: string; sales: ReadonlyArray<RecentSale> }>) {
  if (sales.length === 0) return null;

  return (
    <section
      aria-label={`Recent sales in ${postcode}`}
      className="rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)] sm:p-6"
    >
      <h3 className="font-heading text-lg font-bold tracking-[-0.01em] text-brand-primary-dark">
        Recent sales in {postcode}
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-primary/10 text-left font-sans text-xs font-semibold uppercase tracking-[0.08em] text-brand-primary-dark/50">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Date
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Address
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Type
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Sold price
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-brand-primary/5 last:border-b-0">
                <td className="whitespace-nowrap py-2.5 pr-3 text-brand-primary-dark/70">
                  {formatDate(sale.date)}
                </td>
                <td className="py-2.5 pr-3 text-brand-primary-dark">
                  {sale.street || "—"}
                  {sale.newBuild && (
                    <span className="ml-2 inline-block rounded-full bg-brand-primary-lighter px-2 py-0.5 align-middle font-sans text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-primary">
                      New build
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-brand-primary-dark/70">
                  {sale.propertyTypeLabel}
                </td>
                <td className="whitespace-nowrap py-2.5 text-right font-semibold text-brand-primary-dark">
                  {formatPrice(sale.pricePounds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3.5 font-sans text-xs leading-relaxed text-brand-primary-dark/50">
        Source: HM Land Registry Price Paid Data. Sales typically appear ~3 months after
        completion.
      </p>
    </section>
  );
}
