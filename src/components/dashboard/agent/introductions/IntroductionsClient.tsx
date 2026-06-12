"use client";

/**
 * Client wrapper for the agent introductions ledger: owns row selection, the
 * dispute (rebuttal) modal and the report-outcome modal. Rebuttals go to
 * POST /api/truedeed/rebuttals as multipart form data; outcomes go to
 * POST /api/truedeed/outcomes as JSON.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IntroductionsTable,
  type IntroductionRow,
} from "./IntroductionsTable";
import { RebuttalModal, type RebuttalSubmission } from "./RebuttalModal";
import {
  ReportOutcomeModal,
  type OutcomeSubmission,
} from "./ReportOutcomeModal";

type Props = Readonly<{
  introductions: IntroductionRow[];
}>;

export function IntroductionsClient({ introductions }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [outcomeId, setOutcomeId] = useState<string | null>(null);
  const [isReportingOutcome, setIsReportingOutcome] = useState(false);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);
  const [outcomeSuccess, setOutcomeSuccess] = useState<string | null>(null);

  const active = introductions.find((intro) => intro.id === activeId) ?? null;
  const outcomeIntro =
    introductions.find((intro) => intro.id === outcomeId) ?? null;

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

  function openOutcome(id: string) {
    setOutcomeError(null);
    setOutcomeSuccess(null);
    setOutcomeId(id);
  }

  function closeOutcomeModal() {
    setOutcomeId(null);
    setOutcomeError(null);
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

  async function handleOutcomeSubmit(submission: OutcomeSubmission) {
    if (!outcomeIntro) return;
    setIsReportingOutcome(true);
    setOutcomeError(null);
    try {
      const res = await fetch("/api/truedeed/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          introductionId: outcomeIntro.id,
          outcome: submission.outcome,
          ...(submission.completionDate
            ? { completionDate: submission.completionDate }
            : {}),
          ...(submission.agreedPricePence !== undefined
            ? { agreedPricePence: submission.agreedPricePence }
            : {}),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setOutcomeError(body?.error ?? "Failed to report the outcome.");
        return;
      }

      closeOutcomeModal();
      setOutcomeSuccess("Outcome reported.");
      router.refresh();
    } catch {
      setOutcomeError("Failed to report the outcome. Please try again.");
    } finally {
      setIsReportingOutcome(false);
    }
  }

  return (
    <>
      {outcomeSuccess && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {outcomeSuccess}
        </p>
      )}
      <IntroductionsTable
        introductions={introductions}
        onSelect={openDispute}
        onDispute={openDispute}
        onReportOutcome={openOutcome}
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
      {outcomeIntro && (
        <ReportOutcomeModal
          key={outcomeIntro.id}
          introduction={outcomeIntro}
          open
          onClose={closeOutcomeModal}
          onSubmit={handleOutcomeSubmit}
          isSubmitting={isReportingOutcome}
          serverError={outcomeError}
        />
      )}
    </>
  );
}
