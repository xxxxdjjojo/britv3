"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SearchTriggerProps = Readonly<{
  className?: string;
  transparent?: boolean;
}>;

export function SearchTrigger({ className, transparent = false }: SearchTriggerProps) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-2",
        transparent
          ? "text-white/80 hover:text-white hover:bg-white/10"
          : "text-neutral-500 hover:text-neutral-700",
        className,
      )}
      onClick={handleClick}
      aria-label="Search"
    >
      <Search className="size-4" />
      <span className="hidden text-sm font-normal xl:inline">Search...</span>
      <kbd
        className={cn(
          "pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium xl:inline-flex",
          transparent
            ? "border-white/20 text-white/60"
            : "border-neutral-200 text-neutral-400",
        )}
      >
        <span className="text-xs">&#8984;</span>K
      </kbd>
    </Button>
  );
}
