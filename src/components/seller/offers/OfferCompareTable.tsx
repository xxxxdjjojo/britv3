import { CheckCircle, Clock } from "lucide-react";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";

type Props = Readonly<{ offers: SellerOffer[] }>;

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const classes = cn(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    status === "pending" && "bg-amber-100 text-amber-800",
    status === "accepted" && "bg-emerald-100 text-emerald-800",
    status === "countered" && "bg-blue-100 text-blue-800",
    status === "rejected" && "bg-red-100 text-red-700",
    status === "withdrawn" && "bg-stone-100 text-stone-600",
  );
  return <span className={classes}>{status}</span>;
}

export function OfferCompareTable({ offers }: Props) {
  const displayed = offers.slice(0, 3);
  const listingRaw = displayed[0]?.listing;
  const asking =
    listingRaw && typeof listingRaw === "object" && "asking_price" in listingRaw
      ? (listingRaw as { asking_price: number | null }).asking_price
      : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">Buyer</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Proof of Funds</th>
            <th className="px-6 py-4">Position</th>
            <th className="px-6 py-4">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {displayed.map((offer) => {
            const diff = asking ? offer.amount - asking : null;
            const isAbove = diff !== null && diff > 0;
            const isBelow = diff !== null && diff < -100;

            return (
              <tr
                key={offer.id}
                className="hover:bg-stone-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-emerald-900">
                    {offer.buyer_name}
                  </div>
                  <div className="text-xs text-stone-400 italic capitalize">
                    {offer.buyer_type ?? "—"} buyer
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-stone-900">
                    £{(offer.amount / 100).toLocaleString("en-GB")}
                  </div>
                  {diff !== null && (
                    <div
                      className={cn(
                        "text-xs font-medium",
                        isAbove && "text-emerald-600",
                        isBelow && "text-red-500",
                        !isAbove && !isBelow && "text-stone-400",
                      )}
                    >
                      {isAbove
                        ? `+£${(diff / 100).toLocaleString("en-GB")}`
                        : isBelow
                          ? `−£${(Math.abs(diff) / 100).toLocaleString("en-GB")}`
                          : "At asking"}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={offer.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {offer.is_verified ? (
                      <CheckCircle
                        size={14}
                        className="text-emerald-600 flex-shrink-0"
                      />
                    ) : (
                      <Clock
                        size={14}
                        className="text-stone-400 flex-shrink-0"
                      />
                    )}
                    <span className="text-sm text-stone-600">
                      {offer.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      offer.chain_status === "chain_free"
                        ? "text-emerald-700"
                        : "text-amber-700",
                    )}
                  >
                    {offer.chain_status === "chain_free"
                      ? "Chain-free"
                      : `Chain (${offer.chain_length ?? "?"})`}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-stone-400 max-w-[200px] truncate">
                  {offer.conditions ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
