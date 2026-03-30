"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  Link2Off,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";
import { OfferActionModal } from "./OfferActionModal";

type Props = Readonly<{
  offer: SellerOffer;
  onUpdated: () => void;
}>;

type ListingShape = {
  asking_price: number | null;
} | null;

export function OfferCard({ offer, onUpdated }: Props) {
  const [modalAction, setModalAction] = useState<
    "accept" | "counter" | "reject" | null
  >(null);

  const listing = offer.listing as unknown as ListingShape;
  const asking = listing?.asking_price ?? null;
  const amount = offer.amount;
  const amountPounds = `£${(amount / 100).toLocaleString("en-GB")}`;

  let amountColorClass = "text-[#1a1c1c]";
  let TrendIcon: React.ElementType | null = null;
  let percentageText = "";

  if (asking) {
    const diff = ((amount - asking) / asking) * 100;
    percentageText = `${diff >= 0 ? "+" : ""}${Math.round(diff * 10) / 10}% vs asking`;
    if (diff > 0) {
      amountColorClass = "text-emerald-600";
      TrendIcon = TrendingUp;
    } else if (diff < -1) {
      amountColorClass = "text-red-500";
      TrendIcon = TrendingDown;
    } else {
      amountColorClass = "text-[#1a1c1c]/60";
    }
  }

  const statusClass = cn(
    "inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
    offer.status === "pending" && "bg-amber-100 text-amber-700",
    offer.status === "accepted" && "bg-emerald-100 text-emerald-700",
    offer.status === "countered" && "bg-blue-100 text-blue-700",
    offer.status === "rejected" && "bg-red-100 text-red-600",
    offer.status === "withdrawn" && "bg-stone-100 text-stone-500",
  );

  return (
    <>
      <div className="bg-[#faf9f8] rounded-2xl p-6 hover:bg-[#f4f3f2] transition-colors">
        <div className="flex items-start justify-between gap-4">
          {/* Buyer info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#D4A853]/30 to-[#D4A853]/10 flex items-center justify-center text-[#D4A853] font-bold text-base flex-shrink-0">
              {offer.buyer_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-[#1a1c1c] text-sm">
                  {offer.buyer_name}
                </p>
                {offer.is_verified && (
                  <BadgeCheck size={15} className="text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    offer.chain_status === "chain_free"
                      ? "text-emerald-600"
                      : "text-amber-600",
                  )}
                >
                  {offer.chain_status === "chain_free" ? (
                    <CheckCircle size={11} />
                  ) : (
                    <Link2Off size={11} />
                  )}
                  {offer.chain_status === "chain_free"
                    ? "Chain-free"
                    : `In chain (${offer.chain_length ?? "?"})`}
                </span>
                {offer.buyer_type && (
                  <span className="text-xs text-[#1a1c1c]/50 capitalize">
                    {offer.buyer_type} buyer
                  </span>
                )}
                <span className="text-xs text-[#1a1c1c]/30">
                  {new Date(offer.offered_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Amount + status */}
          <div className="text-right flex-shrink-0">
            <p className={cn("text-2xl font-black", amountColorClass)}>
              {amountPounds}
            </p>
            {percentageText && TrendIcon && (
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <TrendIcon size={13} className={amountColorClass} />
                <span className={cn("text-xs font-medium", amountColorClass)}>
                  {percentageText}
                </span>
              </div>
            )}
            <span className={cn("mt-2", statusClass)}>{offer.status}</span>
          </div>
        </div>

        {offer.conditions && (
          <div className="mt-4 pt-4 border-t border-[#1a1c1c]/5">
            <p className="text-xs text-[#1a1c1c]/40 font-semibold uppercase tracking-wide">
              Conditions
            </p>
            <p className="text-xs text-[#1a1c1c]/60 mt-1">{offer.conditions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#1a1c1c]/5">
          {offer.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => setModalAction("accept")}
                className="flex-1 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] active:scale-95 transition-all"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => setModalAction("counter")}
                className="flex-1 py-2.5 rounded-xl bg-[#faf9f8] hover:bg-[#e3e2e1] text-[#1a1c1c] text-sm font-semibold transition-colors"
              >
                Counter
              </button>
              <button
                type="button"
                onClick={() => setModalAction("reject")}
                className="py-2.5 px-4 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          <Link
            href={`/dashboard/seller/offers/${offer.id}`}
            className="ml-auto flex items-center gap-1 text-xs text-[#1B4D3E] font-semibold hover:underline flex-shrink-0"
          >
            View full negotiation
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {modalAction && (
        <OfferActionModal
          offer={offer}
          action={modalAction}
          onClose={() => setModalAction(null)}
          onSuccess={() => {
            setModalAction(null);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
