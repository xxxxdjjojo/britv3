"use client";

import type { SellerListing } from "@/types/seller";

type Props = Readonly<{ listing: Partial<SellerListing> | null; listingId: string }>;

export function Step6Epc({ listingId: _ }: Props) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">
      Step 6: EPC Upload — coming soon
    </div>
  );
}
