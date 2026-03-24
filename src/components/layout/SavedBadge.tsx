"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type SavedBadgeProps = Readonly<{
  count?: number;
  className?: string;
  transparent?: boolean;
}>;

export function SavedBadge({ count = 0, className, transparent = false }: SavedBadgeProps) {
  return (
    <Link
      href="/dashboard/saved"
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg p-2 transition-colors",
        transparent
          ? "text-white/80 hover:text-white hover:bg-white/10"
          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100",
        className,
      )}
      aria-label={`Saved properties${count > 0 ? ` (${count})` : ""}`}
    >
      <Heart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
