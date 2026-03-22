"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type StepState = "idle" | "saving" | "error" | "saved";

export function useOnboardingStep(stepNumber: number) {
  const [state, setState] = useState<StepState>("idle");
  const [error, setError] = useState<string | null>(null);

  const saveStep = useCallback(
    async <T>(
      saveFn: (supabase: ReturnType<typeof createClient>) => Promise<T>,
    ): Promise<T | null> => {
      setState("saving");
      setError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Session expired. Please log in again.");
          setState("error");
          setError("Session expired");
          return null;
        }

        const result = await saveFn(supabase);

        // Update onboarding step progress
        await supabase
          .from("profiles")
          .update({ onboarding_step: stepNumber + 1 })
          .eq("id", user.id);

        setState("saved");
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        toast.error(message);
        setState("error");
        setError(message);
        console.error(`[Onboarding Step ${stepNumber}]`, err);
        return null;
      }
    },
    [stepNumber],
  );

  const skipStep = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ onboarding_step: stepNumber + 1 })
        .eq("id", user.id);

      setState("saved");
    } catch (err) {
      console.error(`[Onboarding Step ${stepNumber} skip]`, err);
    }
  }, [stepNumber]);

  return {
    state,
    error,
    saving: state === "saving",
    saveStep,
    skipStep,
    reset: () => {
      setState("idle");
      setError(null);
    },
  };
}
