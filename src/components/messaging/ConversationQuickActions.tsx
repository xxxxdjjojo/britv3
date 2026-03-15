"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewingBooking } from "@/components/properties/ViewingBooking";

type Props = Readonly<{
  participantName: string;
  contextType: string;
}>;

export default function ConversationQuickActions({
  participantName,
}: Props) {
  const [viewingOpen, setViewingOpen] = useState(false);

  return (
    <>
      {/* Quick action chips */}
      <div className="flex gap-2 px-4 py-2 border-t overflow-x-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full shrink-0 text-xs gap-1.5"
          onClick={() => setViewingOpen(true)}
        >
          <Calendar className="h-3.5 w-3.5" />
          Schedule Viewing
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full shrink-0 text-xs gap-1.5"
          disabled
          title="Coming soon"
        >
          <FileText className="h-3.5 w-3.5" />
          Send Document
        </Button>
      </div>

      {/* Schedule Viewing modal */}
      <Dialog open={viewingOpen} onOpenChange={setViewingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule a Viewing</DialogTitle>
          </DialogHeader>
          <ViewingBooking
            agentName={participantName}
            propertyAddress="Selected property"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
