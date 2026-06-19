"use client";

import { useState } from "react";
import type { AgentFeedIntegrationView, FeedProvider } from "@/types/agent";
import type { FeedImportReview, PublishResult } from "./types";
import { ConnectStep, DEFAULT_FIELD_MAPPING } from "./ConnectStep";
import { ReviewStep } from "./ReviewStep";
import { PublishStep } from "./PublishStep";
import { Alert } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = Readonly<{
  initialIntegrations: AgentFeedIntegrationView[];
}>;

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ["Connect", "Review", "Publish"] as const;
type Step = (typeof STEPS)[number];

function StepBar({ active }: { active: Step }) {
  return (
    <nav aria-label="Onboarding steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isDone =
            (step === "Connect" && (active === "Review" || active === "Publish")) ||
            (step === "Review" && active === "Publish");
          const isCurrent = step === active;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={[
                    "flex size-7 items-center justify-center rounded-full text-xs font-bold ring-2 transition-all",
                    isDone
                      ? "bg-brand-primary ring-brand-primary text-white"
                      : isCurrent
                        ? "bg-brand-primary ring-brand-primary text-white shadow-md shadow-brand-primary/30"
                        : "bg-surface ring-border text-muted-foreground",
                  ].join(" ")}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden /> : index + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-foreground"
                      : isDone
                        ? "text-brand-primary dark:text-brand-primary-light"
                        : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-3 h-px w-12 transition-colors ${
                    isDone ? "bg-brand-primary" : "bg-border"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function FeedIntegrationConfig({ initialIntegrations }: Props) {
  const [integrations, setIntegrations] = useState<AgentFeedIntegrationView[]>(initialIntegrations);

  // --- step state ---
  const [review, setReview] = useState<FeedImportReview | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  // --- connect form state ---
  const [formProvider, setFormProvider] = useState<FeedProvider>("reapit");
  const [formApiKey, setFormApiKey] = useState("");
  const [formFieldMapping, setFormFieldMapping] = useState<Record<string, string>>(DEFAULT_FIELD_MAPPING);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- test connection state ---
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // --- sync/delete state ---
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // --- review/publish state ---
  const [approving, setApproving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Derived step
  // ---------------------------------------------------------------------------

  const activeStep: Step =
    publishResult != null ? "Publish" : review != null ? "Review" : "Connect";

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleTestConnection(integrationId: string) {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch(
        `/api/agent/feeds/${encodeURIComponent(integrationId)}/test`,
        { method: "POST" },
      );
      const json = (await res.json()) as { ok: boolean; message: string };
      setTestResult({ ok: json.ok, message: json.message });
    } catch {
      setTestResult({ ok: false, message: "Network error — could not reach test endpoint." });
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleSave() {
    if (formProvider === "reapit" && !formApiKey.trim()) {
      setFormError("API key is required for the Reapit connection.");
      return;
    }
    if (formProvider === "csv" && !csvText) {
      setFormError("Please select a CSV file to upload.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        provider: formProvider,
        field_mapping: formFieldMapping,
      };
      if (formApiKey.trim()) body.api_key = formApiKey.trim();
      if (csvText) body.payload = csvText;

      const res = await fetch("/api/agent/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setFormError(json.error ?? "Failed to create integration.");
        return;
      }
      const created = (await res.json()) as AgentFeedIntegrationView;
      setIntegrations((prev) => [created, ...prev]);
      setFormApiKey("");
      setCsvText(null);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleSyncNow(integrationId: string) {
    setSyncingId(integrationId);
    setFlowError(null);
    setPublishResult(null);
    setReview(null);
    try {
      const body: Record<string, unknown> = {};
      if (formProvider === "csv" && csvText) {
        body.payload = csvText;
        body.fieldMapping = formFieldMapping;
      }
      const res = await fetch(
        `/api/agent/feeds/${encodeURIComponent(integrationId)}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        },
      );
      if (res.ok) {
        const payload = (await res.json()) as {
          integration: AgentFeedIntegrationView;
          review: FeedImportReview;
        };
        setIntegrations((prev) =>
          prev.map((i) => (i.id === integrationId ? payload.integration : i)),
        );
        setReview(payload.review);
      } else {
        const json = (await res.json()) as { error?: string };
        setFlowError(json.error ?? "Failed to sync feed.");
      }
    } catch {
      setFlowError("Network error while syncing feed.");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleApproveReview() {
    if (!review) return;
    setApproving(true);
    setFlowError(null);
    try {
      const res = await fetch(`/api/agent/feed-imports/${review.run.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setFlowError(json.error ?? "Failed to approve feed items.");
        return;
      }
      const payload = (await res.json()) as { review: FeedImportReview };
      setReview(payload.review);
    } catch {
      setFlowError("Network error while approving feed items.");
    } finally {
      setApproving(false);
    }
  }

  async function handlePublishReview() {
    if (!review) return;
    setPublishing(true);
    setFlowError(null);
    try {
      const res = await fetch(`/api/agent/feed-imports/${review.run.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setFlowError(json.error ?? "Failed to publish feed items.");
        return;
      }
      const payload = (await res.json()) as PublishResult;
      setPublishResult(payload);
      setReview(payload.review);
    } catch {
      setFlowError("Network error while publishing feed items.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(integrationId: string) {
    setDeletingId(integrationId);
    try {
      const res = await fetch(
        `/api/agent/feeds?id=${encodeURIComponent(integrationId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function handleSyncAgain() {
    setPublishResult(null);
    setReview(null);
    setFlowError(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mt-8">
      <StepBar active={activeStep} />

      {/* Global flow error (not form-level) */}
      {flowError && activeStep === "Connect" && (
        <Alert className="mb-6 border-destructive/30 bg-destructive/10 text-destructive">
          <AlertCircle className="size-4" aria-hidden />
          <span className="ml-2 text-sm">{flowError}</span>
        </Alert>
      )}

      {activeStep === "Connect" && (
        <ConnectStep
          integrations={integrations}
          formProvider={formProvider}
          formApiKey={formApiKey}
          formFieldMapping={formFieldMapping}
          csvText={csvText}
          formError={formError}
          formSubmitting={formSubmitting}
          testingConnection={testingConnection}
          testResult={testResult}
          syncingId={syncingId}
          deletingId={deletingId}
          onSelectProvider={(p) => {
            setFormProvider(p);
            setFormError(null);
            setTestResult(null);
          }}
          onApiKeyChange={setFormApiKey}
          onFieldMappingChange={setFormFieldMapping}
          onCsvFileChange={setCsvText}
          onTestConnection={handleTestConnection}
          onSave={handleSave}
          onSyncNow={handleSyncNow}
          onDelete={handleDelete}
          onConfirmDelete={setConfirmDeleteId}
        />
      )}

      {activeStep === "Review" && review && (
        <ReviewStep
          review={review}
          approving={approving}
          publishing={publishing}
          flowError={flowError}
          onApprove={handleApproveReview}
          onPublish={handlePublishReview}
        />
      )}

      {activeStep === "Publish" && publishResult && review && (
        <PublishStep
          publishedCount={publishResult.published_count}
          review={review}
          onSyncAgain={handleSyncAgain}
        />
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h3 className="text-base font-semibold text-foreground">Delete integration?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will remove the feed connection and stop all syncing. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
