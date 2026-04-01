import { CheckCircle, Clock } from "lucide-react";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";

type Props = Readonly<{ offers: SellerOffer[] }>;

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const classes = cn(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    status === "pending" && "bg-secondary-container/30 text-secondary",
    status === "accepted" && "bg-primary-container/20 text-primary",
    status === "countered" && "bg-tertiary-container/20 text-tertiary",
    status === "rejected" && "bg-error-container text-error",
    status === "withdrawn" && "bg-surface-container text-on-surface-variant",
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
          <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">Buyer</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Proof of Funds</th>
            <th className="px-6 py-4">Position</th>
            <th className="px-6 py-4">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {displayed.map((offer) => {
            const diff = asking ? offer.amount - asking : null;
            const isAbove = diff !== null && diff > 0;
            const isBelow = diff !== null && diff < -100;

            return (
              <tr
                key={offer.id}
                className="hover:bg-surface-container-low transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-primary">
                    {offer.buyer_name}
                  </div>
                  <div className="text-xs text-outline italic capitalize">
                    {offer.buyer_type ?? "—"} buyer
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-on-surface">
                    £{(offer.amount / 100).toLocaleString("en-GB")}
                  </div>
                  {diff !== null && (
                    <div
                      className={cn(
                        "text-xs font-medium",
                        isAbove && "text-primary",
                        isBelow && "text-error",
                        !isAbove && !isBelow && "text-outline",
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
                        className="text-primary flex-shrink-0"
                      />
                    ) : (
                      <Clock
                        size={14}
                        className="text-outline flex-shrink-0"
                      />
                    )}
                    <span className="text-sm text-on-surface-variant">
                      {offer.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      offer.chain_status === "chain_free"
                        ? "text-primary"
                        : "text-secondary",
                    )}
                  >
                    {offer.chain_status === "chain_free"
                      ? "Chain-free"
                      : `Chain (${offer.chain_length ?? "?"})`}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-outline max-w-[200px] truncate">
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
