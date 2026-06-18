"use client";

/**
 * Heart icon button for saving/unsaving a property to the user's shortlist.
 * Uses optimistic updates via useSavedProperties hooks.
 * Redirects to login if not authenticated.
 */

import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsPropertySaved,
  useSaveProperty,
  useUnsaveProperty,
} from "@/hooks/useSavedProperties";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeartIcon } from "lucide-react";

type SaveButtonProps = Readonly<{
  listingId: string;
  size?: "sm" | "default";
}>;

export function SaveButton({ listingId, size = "default" }: SaveButtonProps) {
  const { user } = useAuth();
  const isSaved = useIsPropertySaved(listingId);
  const saveProperty = useSaveProperty();
  const unsaveProperty = useUnsaveProperty();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Require auth
      if (!user) {
        const currentPage = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirectTo=${currentPage}`;
        return;
      }

      if (isSaved) {
        unsaveProperty.mutate({ listingId });
      } else {
        saveProperty.mutate({ listingId });
      }
    },
    [user, isSaved, listingId, saveProperty, unsaveProperty],
  );

  const buttonSize = size === "sm" ? "icon-sm" : "icon";

  const button = (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={handleClick}
      className={`rounded-full bg-background/80 backdrop-blur-sm hover:bg-background ${
        isSaved ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-label={isSaved ? "Remove from saved" : "Save property"}
    >
      <HeartIcon
        className={`${size === "sm" ? "size-4" : "size-5"} ${isSaved ? "fill-current" : ""}`}
      />
    </Button>
  );

  // Show tooltip hint for unauthenticated users
  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          {/* Base UI uses a `render` prop (not Radix `asChild`): render the
              existing button AS the trigger so we don't nest <button><button>. */}
          <TooltipTrigger render={button} />
          <TooltipContent side="bottom">
            Sign in to save properties
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
