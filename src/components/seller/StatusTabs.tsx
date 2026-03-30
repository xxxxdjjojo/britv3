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
    <div className="flex items-center gap-1 bg-[--color-neutral-100] rounded-xl p-1">
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
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150",
            active === tab.key
              ? "bg-white text-[--color-brand-primary] shadow-sm"
              : "text-[--color-neutral-500] hover:text-[--color-neutral-900]",
          )}
        >
          {tab.label}
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            active === tab.key
              ? "bg-[--color-brand-primary-lighter] text-[--color-brand-primary]"
              : "bg-[--color-neutral-200] text-[--color-neutral-500]",
          )}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
