"use client";

/**
 * Client wrapper for the agent introductions ledger: owns row selection and
 * the dispute (rebuttal) modal, and submits rebuttals to
 * POST /api/truedeed/rebuttals as multipart form data.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IntroductionsTable,
  type IntroductionRow,
} from "./IntroductionsTable";
import { RebuttalModal, type RebuttalSubmission } from "./RebuttalModal";

type Props = Readonly<{
  introductions: IntroductionRow[];
}>;

export function IntroductionsClient({ introductions }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const active = introductions.find((intro) => intro.id === activeId) ?? null;

  function openDispute(id: string) {
    const intro = introductions.find((row) => row.id === id);
    if (!intro?.rebuttalOpen) return;
    setServerError(null);
    setActiveId(id);
  }

  function closeModal() {
    setActiveId(null);
    setServerError(null);
  }

  async function handleSubmit({ evidenceDatedAt, files }: RebuttalSubmission) {
    if (!active) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append("introductionId", active.id);
      formData.append("evidenceDatedAt", evidenceDatedAt);
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/truedeed/rebuttals", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setServerError(body?.error ?? "Failed to submit your dispute.");
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setServerError("Failed to submit your dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <IntroductionsTable
        introductions={introductions}
        onSelect={openDispute}
        onDispute={openDispute}
      />
      {active && (
        <RebuttalModal
          key={active.id}
          introduction={active}
          open
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      )}
    </>
  );
}
