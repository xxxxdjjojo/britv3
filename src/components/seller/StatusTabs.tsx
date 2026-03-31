"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/types/seller";

type Tab = Readonly<{
  key: ListingStatus | "all";
  label: string;
  count: number;
}>;

type Props = Readonly<{
  tabs: Tab[];
}>;

export function StatusTabs({ tabs }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("status") ?? "all";

  return (
    <div className="flex items-center gap-6 border-b border-[--color-surface-container-high]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            if (tab.key === "all") params.delete("status");
            else params.set("status", tab.key);
            router.push(`?${params.toString()}`);
          }}
          className={cn(
            "pb-4 text-sm font-semibold tracking-wide transition-colors duration-150 whitespace-nowrap border-b-2 -mb-px",
            active === tab.key
              ? "text-[--color-brand-primary-dark] border-[--color-brand-primary-dark]"
              : "text-zinc-400 border-transparent hover:text-[--color-brand-primary-dark]"
          )}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
