"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle,
  Link2Off,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";
import { OfferActionModal } from "./OfferActionModal";

type Props = Readonly<{
  offer: SellerOffer;
  onUpdated: () => void;
  featured?: boolean;
}>;

type ListingShape = {
  asking_price: number | null;
} | null;

export function OfferCard({ offer, onUpdated, featured = false }: Props) {
  const [modalAction, setModalAction] = useState<
    "accept" | "counter" | "reject" | null
  >(null);

  const listing = offer.listing as unknown as ListingShape;
  const asking = listing?.asking_price ?? null;
  const amount = offer.amount;
  const amountPounds = `£${(amount / 100).toLocaleString("en-GB")}`;

  let amountDiffLabel = "";
  let amountDiffClass = "text-on-surface-variant text-sm font-medium";

  if (asking) {
    const diff = amount - asking;
    const diffPounds = Math.abs(Math.round(diff / 100));
    const diffFormatted = `£${diffPounds.toLocaleString("en-GB")}`;
    if (diff > 0) {
      amountDiffLabel = `${diffFormatted} over asking`;
      amountDiffClass = "text-primary text-sm font-semibold";
    } else if (diff < -100) {
      amountDiffLabel = "Below asking";
      amountDiffClass = "text-error text-sm font-medium";
    } else {
      amountDiffLabel = "Asking price";
    }
  }

  const statusClass = cn(
    "inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
    offer.status === "pending" && "bg-secondary-container/30 text-secondary",
    offer.status === "accepted" && "bg-primary-container/20 text-primary",
    offer.status === "countered" && "bg-tertiary-container/20 text-tertiary",
    offer.status === "rejected" && "bg-error-container text-error",
    offer.status === "withdrawn" && "bg-surface-container text-on-surface-variant",
  );

  return (
    <>
      <div
        className={cn(
          "bg-surface rounded-2xl overflow-hidden transition-all hover:shadow-lg",
          featured
            ? "border-2 border-primary shadow-xl relative"
            : "border border-outline-variant shadow-md",
        )}
      >
        {featured && (
          <div className="absolute top-4 right-4 bg-primary-container/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight z-10">
            Recommended
          </div>
        )}

        <div className="p-6">
          {/* Buyer avatar + name */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0",
                featured
                  ? "bg-primary-container/20 text-primary"
                  : "bg-surface-container text-on-surface-variant",
              )}
            >
              {offer.buyer_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "text-lg font-bold",
                    featured ? "text-primary" : "text-on-surface",
                  )}
                >
                  {offer.buyer_name}
                </h3>
                {offer.is_verified && (
                  <BadgeCheck size={15} className="text-tertiary flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-outline">
                {new Date(offer.offered_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <span
              className={cn(
                "text-3xl font-bold",
                featured ? "text-primary" : "text-on-surface",
              )}
            >
              {amountPounds}
            </span>
            {amountDiffLabel && (
              <span className={cn("ml-2", amountDiffClass)}>
                {amountDiffLabel}
              </span>
            )}
          </div>

          {/* Details rows */}
          <div className="space-y-0 mb-8">
            <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/30">
              <span className="text-sm text-outline">Position</span>
              <span
                className={cn(
                  "text-sm font-semibold flex items-center gap-1",
                  offer.chain_status === "chain_free"
                    ? "text-primary"
                    : "text-secondary",
                )}
              >
                {offer.chain_status === "chain_free" ? (
                  <CheckCircle size={13} />
                ) : (
                  <Link2Off size={13} />
                )}
                {offer.chain_status === "chain_free"
                  ? "Chain-free"
                  : `Chain (${offer.chain_length ?? "?"})`}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/30">
              <span className="text-sm text-outline">Funding</span>
              <span className="text-sm font-semibold text-on-surface capitalize">
                {offer.buyer_type === "cash"
                  ? "Cash Buyer"
                  : offer.buyer_type === "mortgage"
                    ? "Mortgage"
                    : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-outline">Conditions</span>
              <span
                className={cn(
                  "text-sm font-semibold text-on-surface",
                  !offer.conditions && "italic text-outline",
                )}
              >
                {offer.conditions ?? "None"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {offer.status === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={() => setModalAction("accept")}
                  className={cn(
                    "w-full py-3 text-sm font-bold rounded-xl transition-all",
                    featured
                      ? "bg-primary text-white hover:bg-primary-container"
                      : "border-2 border-primary text-primary hover:bg-primary-container/10",
                  )}
                >
                  Accept Offer
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalAction("counter")}
                    className="py-2.5 border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-all text-sm"
                  >
                    Counter
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAction("reject")}
                    className="py-2.5 border border-error/30 text-error font-semibold rounded-xl hover:bg-error-container/30 transition-all text-sm"
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <span className={statusClass}>{offer.status}</span>
                <Link
                  href={`/dashboard/seller/offers/${offer.id}`}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  View negotiation
                  <ChevronRight size={13} />
                </Link>
              </div>
            )}

            {offer.status === "pending" && (
              <Link
                href={`/dashboard/seller/offers/${offer.id}`}
                className="flex items-center justify-center gap-1 text-xs text-primary font-semibold hover:underline mt-1"
              >
                View full negotiation
                <ChevronRight size={13} />
              </Link>
            )}
          </div>
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
