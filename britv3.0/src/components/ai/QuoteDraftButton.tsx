"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { QuoteDraft, AgentProposal } from "@/services/ai/quote-draft-service";

type QuoteDraftButtonProps = Readonly<{
  rfqDescription: string;
  draftType: "trades" | "agent";
  onDraftReceived: (draft: QuoteDraft | AgentProposal) => void;
  disabled?: boolean;
}>;

export function QuoteDraftButton({
  rfqDescription,
  draftType,
  onDraftReceived,
  disabled = false,
}: QuoteDraftButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/quote-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfq_description: rfqDescription,
          draft_type: draftType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error ?? "Failed to generate draft";
        toast.error(message);
        return;
      }

      const data = await response.json();

      if (!data.draft || data.fallback) {
        toast.info("AI unavailable, please draft manually");
        return;
      }

      onDraftReceived(data.draft);
      toast.success("AI draft generated successfully");
    } catch {
      toast.error("Something went wrong generating the draft");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              onClick={handleClick}
              disabled={disabled || isLoading || !rfqDescription.trim()}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Drafting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Draft Quote with AI
                </>
              )}
            </Button>
          }
        />
        <TooltipContent>
          Uses AI to generate a draft quote based on your rate card and market
          rates
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
