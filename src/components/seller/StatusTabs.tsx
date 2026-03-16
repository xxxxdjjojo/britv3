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
    <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
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
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-150",
            active === tab.key
              ? "border-[#1B4D3E] text-[#1B4D3E]"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          {tab.label}
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            active === tab.key ? "bg-[#1B4D3E]/10 text-[#1B4D3E]" : "bg-slate-100 text-slate-500",
          )}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
