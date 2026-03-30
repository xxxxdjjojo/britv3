"use client";

import { useState } from "react";
import type { SellerOffer } from "@/types/seller";
import { OfferActionModal } from "./OfferActionModal";

type Props = Readonly<{
  offer: SellerOffer;
}>;

export function OfferActionButtons({ offer }: Props) {
  const [modalAction, setModalAction] = useState<
    "accept" | "counter" | "reject" | null
  >(null);

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setModalAction("accept")}
          className="flex-1 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] active:scale-95 transition-all"
        >
          Accept offer
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
      </div>

      {modalAction && (
        <OfferActionModal
          offer={offer}
          action={modalAction}
          onClose={() => setModalAction(null)}
          onSuccess={() => {
            setModalAction(null);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
