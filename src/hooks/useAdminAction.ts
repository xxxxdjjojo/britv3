"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAdminAction() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function execute(url: string, options?: RequestInit): Promise<boolean> {
    if (isPending) return false;
    setIsPending(true);
    try {
      const res = await fetch(url, { method: "POST", ...options });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Action failed");
      }
      router.refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setIsPending(false);
    }
  }

  return { execute, isPending };
}
