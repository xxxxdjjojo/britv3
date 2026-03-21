"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, Clock, User, MapPin, Video } from "lucide-react";
import type { SellerViewing, ViewingStatus } from "@/types/seller";
import { cn } from "@/lib/utils";
import { ViewingActionModal } from "./ViewingActionModal";

const STATUS_CONFIG: Record<ViewingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-700" },
  rescheduled: { label: "Rescheduled", className: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
  completed: { label: "Completed", className: "bg-purple-100 text-purple-700" },
};

type Props = Readonly<{
  viewing: SellerViewing;
  onUpdated: () => void;
}>;

export function ViewingCard({ viewing, onUpdated }: Props) {
  const [modalAction, setModalAction] = useState<"confirm" | "cancel" | "reschedule" | null>(null);
  const statusConfig = STATUS_CONFIG[viewing.status];
  const dt = new Date(viewing.viewing_datetime);
  const listingThumb = (viewing.listing as any)?.photos?.[0]?.url;
  const address = [(viewing.listing as any)?.address_line_1, (viewing.listing as any)?.city].filter(Boolean).join(", ");

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start gap-4">
          {listingThumb ? (
            <div className="relative h-16 w-24 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={listingThumb} alt={address} fill className="object-cover" sizes="96px" />
            </div>
          ) : (
            <div className="h-16 w-24 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center">
              <MapPin size={18} className="text-slate-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 truncate">{address || "Property"}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <User size={12} />
                    {viewing.buyer_name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    {viewing.viewing_type === "virtual" ? <Video size={12} /> : <MapPin size={12} />}
                    {viewing.viewing_type === "virtual" ? "Virtual" : "In-person"}
                  </span>
                </div>
              </div>
              <span className={cn("flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full", statusConfig.className)}>
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                {dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock size={14} className="text-slate-400" />
                {dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
        {!["cancelled", "completed"].includes(viewing.status) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
            {viewing.status === "pending" && (
              <button type="button" onClick={() => setModalAction("confirm")} className="px-3 py-1.5 rounded-lg bg-[#1B4D3E] text-white text-xs font-semibold hover:bg-[#2D7A5F] transition-colors">
                Confirm
              </button>
            )}
            <button type="button" onClick={() => setModalAction("reschedule")} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
              Reschedule
            </button>
            <button type="button" onClick={() => setModalAction("cancel")} className="px-3 py-1.5 rounded-lg text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
              Cancel
            </button>
          </div>
        )}
        {viewing.feedback && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-500 font-semibold mb-1">Buyer feedback</p>
            <p className="text-xs text-slate-600 italic">&quot;{viewing.feedback}&quot;</p>
          </div>
        )}
      </div>
      {modalAction && (
        <ViewingActionModal
          viewing={viewing}
          action={modalAction}
          onClose={() => setModalAction(null)}
          onSuccess={() => { setModalAction(null); onUpdated(); }}
        />
      )}
    </>
  );
}
