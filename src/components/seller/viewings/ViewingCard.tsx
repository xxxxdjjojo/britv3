"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, Clock, User, MapPin, Video } from "lucide-react";
import type { SellerViewing, ViewingStatus } from "@/types/seller";
import { cn } from "@/lib/utils";
import { ViewingActionModal } from "./ViewingActionModal";

const STATUS_CONFIG: Record<ViewingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning-light text-warning" },
  confirmed: { label: "Confirmed", className: "bg-success-light text-success" },
  rescheduled: { label: "Rescheduled", className: "bg-brand-accent-light text-brand-accent" },
  cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-500" },
  completed: { label: "Completed", className: "bg-brand-accent-light text-brand-accent" },
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
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start gap-4">
          {listingThumb ? (
            <div className="relative h-16 w-24 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={listingThumb} alt={address} fill className="object-cover" sizes="96px" />
            </div>
          ) : (
            <div className="h-16 w-24 rounded-xl bg-neutral-100 flex-shrink-0 flex items-center justify-center">
              <MapPin size={18} className="text-neutral-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900 truncate">{address || "Property"}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <User size={12} />
                    {viewing.buyer_name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
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
              <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                <Calendar size={14} className="text-neutral-400" />
                {dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                <Clock size={14} className="text-neutral-400" />
                {dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
        {!["cancelled", "completed"].includes(viewing.status) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-50">
            {viewing.status === "pending" && (
              <button type="button" onClick={() => setModalAction("confirm")} className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-light transition-colors">
                Confirm
              </button>
            )}
            <button type="button" onClick={() => setModalAction("reschedule")} className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-colors">
              Reschedule
            </button>
            <button type="button" onClick={() => setModalAction("cancel")} className="px-3 py-1.5 rounded-lg text-error text-xs font-semibold hover:bg-error-light transition-colors">
              Cancel
            </button>
          </div>
        )}
        {viewing.feedback && (
          <div className="mt-4 pt-4 border-t border-neutral-50">
            <p className="text-xs text-neutral-500 font-semibold mb-1">Buyer feedback</p>
            <p className="text-xs text-neutral-600 italic">&quot;{viewing.feedback}&quot;</p>
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
