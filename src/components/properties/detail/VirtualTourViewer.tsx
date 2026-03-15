"use client";

import { Home, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type VirtualTourViewerProps = Readonly<{
  tourUrl: string | null;
}>;

export function VirtualTourViewer({ tourUrl }: VirtualTourViewerProps) {
  // Empty state
  if (!tourUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-neutral-50 p-10 text-center">
        <Home className="size-10 text-neutral-300" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Virtual tour not available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This property doesn&apos;t have a virtual tour yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border">
        <iframe
          src={tourUrl}
          className="w-full h-96 block"
          title="Virtual tour"
          allow="fullscreen; vr; xr-spatial-tracking"
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          asChild
        >
          <a href={tourUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            View full screen
          </a>
        </Button>
      </div>
    </div>
  );
}
