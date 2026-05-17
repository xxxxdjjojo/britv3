"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({
  url,
}: Readonly<{
  url: string;
}>) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary"
    >
      <Link2 className="size-4" />
      Copy Link
    </button>
  );
}
