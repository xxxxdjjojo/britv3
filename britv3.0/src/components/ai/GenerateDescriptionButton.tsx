"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAiDescription } from "@/hooks/useAiDescription";
import type { PropertyDescriptionInput } from "@/hooks/useAiDescription";
import type { Tone } from "@/config/prompts/property-description";

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "premium", label: "Premium" },
];

type GenerateDescriptionButtonProps = Readonly<{
  listingId: string;
  propertyAttributes: PropertyDescriptionInput;
  onDescriptionGenerated: (description: string) => void;
}>;

export function GenerateDescriptionButton({
  listingId,
  propertyAttributes,
  onDescriptionGenerated,
}: GenerateDescriptionButtonProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>("professional");
  const {
    description,
    isLoading,
    error,
    regenerationCount,
    canRegenerate,
    generate,
  } = useAiDescription();

  const callbackRef = useRef(onDescriptionGenerated);
  callbackRef.current = onDescriptionGenerated;

  // Pass generated description to parent via callback
  useEffect(() => {
    if (description) {
      callbackRef.current(description);
    }
  }, [description]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleClick = async () => {
    await generate(propertyAttributes, selectedTone, listingId);
  };

  return (
    <div className="space-y-3">
      {/* Tone selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tone:</span>
        <div className="flex gap-1">
          {TONES.map((tone) => (
            <Button
              key={tone.value}
              variant={selectedTone === tone.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTone(tone.value)}
              disabled={isLoading}
            >
              {tone.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleClick}
          disabled={!canRegenerate || isLoading}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Description"
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {regenerationCount}/3 regenerations used
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
