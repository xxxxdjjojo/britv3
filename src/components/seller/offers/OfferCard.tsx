"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, BadgeCheck, Link2Off, CheckCircle } from "lucide-react";
import type { SellerOffer } from "@/types/seller";
import { cn } from "@/lib/utils";
import { OfferActionModal } from "./OfferActionModal";

type Props = Readonly<{
  offer: SellerOffer;
  onUpdated: () => void;
}>;

export function OfferCard({ offer, onUpdated }: Props) {
  const [modalAction, setModalAction] = useState<"accept" | "counter" | "reject" | null>(null);
  const asking = (offer.listing as any)?.asking_price ?? null;
  const amount = offer.amount;
  const amountPounds = `£${(amount / 100).toLocaleString("en-GB")}`;
  let amountColorClass = "text-slate-700";
  let TrendIcon: React.ElementType | null = null;
  let percentageText = "";

  if (asking) {
    const diff = ((amount - asking) / asking) * 100;
    percentageText = `${diff >= 0 ? "+" : ""}${Math.round(diff * 10) / 10}% vs asking`;
    if (diff > 0) { amountColorClass = "text-green-600"; TrendIcon = TrendingUp; }
    else if (diff < -1) { amountColorClass = "text-red-600"; TrendIcon = TrendingDown; }
    else { amountColorClass = "text-slate-500"; }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1B4D3E]/20 to-[#D4A853]/20 flex items-center justify-center text-[#1B4D3E] font-bold text-lg flex-shrink-0">
              {offer.buyer_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{offer.buyer_name}</p>
                {offer.is_verified && <BadgeCheck size={16} className="text-blue-500" />}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={cn("flex items-center gap-1 text-xs font-medium", offer.chain_status === "chain_free" ? "text-emerald-600" : "text-amber-600")}>
                  {offer.chain_status === "chain_free" ? <CheckCircle size={12} /> : <Link2Off size={12} />}
                  {offer.chain_status === "chain_free" ? "Chain-free" : `In chain (${offer.chain_length ?? "?"})`}
                </span>
                {offer.buyer_type && <span className="text-xs text-slate-500 capitalize">{offer.buyer_type} buyer</span>}
                <span className="text-xs text-slate-400">
                  {new Date(offer.offered_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={cn("text-3xl font-black", amountColorClass)}>{amountPounds}</p>
            {percentageText && TrendIcon && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <TrendIcon size={14} className={amountColorClass} />
                <span className={cn("text-xs font-medium", amountColorClass)}>{percentageText}</span>
              </div>
            )}
            <span className={cn(
              "mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
              offer.status === "pending" ? "bg-amber-100 text-amber-700" :
              offer.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
              offer.status === "countered" ? "bg-blue-100 text-blue-700" :
              offer.status === "rejected" ? "bg-red-100 text-red-600" :
              "bg-slate-100 text-slate-500",
            )}>
              {offer.status}
            </span>
          </div>
        </div>
        {offer.conditions && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-500 font-semibold">Conditions</p>
            <p className="text-xs text-slate-600 mt-1">{offer.conditions}</p>
          </div>
        )}
        {offer.status === "pending" && (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-50">
            <button type="button" onClick={() => setModalAction("accept")} className="flex-1 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] active:scale-95 transition-all">Accept</button>
            <button type="button" onClick={() => setModalAction("counter")} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">Counter</button>
            <button type="button" onClick={() => setModalAction("reject")} className="py-2.5 px-4 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">Reject</button>
          </div>
        )}
      </div>
      {modalAction && (
        <OfferActionModal
          offer={offer}
          action={modalAction}
          onClose={() => setModalAction(null)}
          onSuccess={() => { setModalAction(null); onUpdated(); }}
        />
      )}
    </>
  );
}
