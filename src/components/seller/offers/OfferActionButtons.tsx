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
          className="flex-1 py-2.5 rounded-xl bg-[--color-brand-primary] text-white text-sm font-semibold hover:bg-[--color-brand-primary-light] active:scale-95 transition-all"
        >
          Accept offer
        </button>
        <button
          type="button"
          onClick={() => setModalAction("counter")}
          className="flex-1 py-2.5 rounded-xl bg-[--color-surface] hover:bg-[--color-surface-container-highest] text-[--color-on-surface] text-sm font-semibold transition-colors"
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
