"use client";

import { useState, useCallback } from "react";
import type { Tone } from "@/config/prompts/property-description";

/** Input attributes for property description generation */
export type PropertyDescriptionInput = Readonly<{
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  location: string;
  price: number;
  tenure?: "freehold" | "leasehold";
}>;

type UseAiDescriptionReturn = {
  description: string | null;
  isLoading: boolean;
  error: string | null;
  regenerationCount: number;
  canRegenerate: boolean;
  generate: (listing: PropertyDescriptionInput, tone: Tone, listingId: string) => Promise<void>;
};

/**
 * Custom hook for managing AI description generation state.
 * Handles loading, errors, and regeneration tracking.
 */
export function useAiDescription(): UseAiDescriptionReturn {
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);

  const canRegenerate = regenerationCount < 3;

  const generate = useCallback(
    async (listing: PropertyDescriptionInput, tone: Tone, listingId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...listing,
            tone,
            listingId,
          }),
        });

        if (response.status === 401) {
          setError("You must be logged in to generate descriptions.");
          return;
        }

        if (response.status === 429) {
          setError("Maximum regenerations reached (3/3).");
          return;
        }

        if (response.status === 503) {
          setError("AI is temporarily unavailable. Please try again later.");
          return;
        }

        if (!response.ok) {
          setError("Something went wrong. Please try again.");
          return;
        }

        const data = await response.json();
        setDescription(data.description);
        setRegenerationCount((prev) => prev + 1);
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    description,
    isLoading,
    error,
    regenerationCount,
    canRegenerate,
    generate,
  };
}
