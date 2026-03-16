"use client";

import type { SellerListing } from "@/types/seller";

type Props = Readonly<{ listing: Partial<SellerListing> | null; listingId: string }>;

export function Step7Review({ listingId: _ }: Props) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">
      Step 7: Review &amp; Publish — coming soon
    </div>
  );
}
