"use client";

/**
 * Share button -- uses Web Share API when available, falls back to clipboard copy.
 */

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "lucide-react";
import { toast } from "sonner";

type ShareButtonProps = Readonly<{
  title: string;
}>;

export function ShareButton({ title }: ShareButtonProps) {
  const handleShare = useCallback(async () => {
    const url = window.location.href;

    // Try Web Share API first
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or API failed -- fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [title]);

  return (
    <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
      <ShareIcon className="size-4" />
      Share
    </Button>
  );
}
