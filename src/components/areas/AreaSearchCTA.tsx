import Link from "next/link";
import { ArrowRight } from "lucide-react";

type AreaSearchCTAProps = Readonly<{
  areaName: string; citySlug: string; areaSlug?: string; variant?: "inline" | "hero";
}>;

export function AreaSearchCTA({ areaName, citySlug, areaSlug, variant = "inline" }: AreaSearchCTAProps) {
  const searchBase = areaSlug ? `/search?city=${citySlug}&area=${areaSlug}` : `/search?city=${citySlug}`;

  if (variant === "hero") {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`${searchBase}&type=buy`} className="bg-primary text-white rounded-xl px-6 py-3 font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          Properties for sale in {areaName} <ArrowRight className="size-4" />
        </Link>
        <Link href={`${searchBase}&type=rent`} className="border-2 border-primary text-primary rounded-xl px-6 py-3 font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          To rent in {areaName} <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-neutral-700 font-medium">Ready to find your next home in <strong>{areaName}</strong>?</p>
      <div className="flex gap-3">
        <Link href={`${searchBase}&type=buy`} className="bg-primary text-white rounded-lg px-5 py-2.5 font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          For sale <ArrowRight className="size-3.5" />
        </Link>
        <Link href={`${searchBase}&type=rent`} className="border border-primary/20 text-primary rounded-lg px-5 py-2.5 font-bold text-sm hover:bg-primary/5 transition-colors">
          To rent
        </Link>
      </div>
    </div>
  );
}
