"use client";

/**
 * PropertyDetailActions
 *
 * Thin client wrapper that manages open/close state for ShareModal and
 * ReportListingModal, and renders the Share and Report trigger buttons.
 *
 * Lives beside the Save button in the sticky info bar so all three
 * interactive actions are co-located in one client island.
 */

import { useState } from "react";
import { Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal } from "./ShareModal";
import { ReportListingModal } from "./ReportListingModal";

type Props = Readonly<{
  propertyId: string;
  propertyUrl: string;
  propertyTitle: string;
}>;

export function PropertyDetailActions({
  propertyId,
  propertyUrl,
  propertyTitle,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      {/* Trigger buttons */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setShareOpen(true)}
        aria-label="Share this property"
      >
        <Share2 className="size-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setReportOpen(true)}
        aria-label="Report this listing"
      >
        <Flag className="size-4" />
        <span className="hidden sm:inline">Report</span>
      </Button>

      {/* Modals — rendered at the island boundary, not in the portal DOM */}
      <ShareModal
        propertyUrl={propertyUrl}
        propertyTitle={propertyTitle}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <ReportListingModal
        propertyId={propertyId}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
