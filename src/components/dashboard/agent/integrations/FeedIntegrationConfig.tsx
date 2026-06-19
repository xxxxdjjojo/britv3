"use client";

import { useState } from "react";
import type { AgentFeedIntegrationView, FeedProvider, SyncStatus } from "@/types/agent";

type Props = Readonly<{
  initialIntegrations: AgentFeedIntegrationView[];
}>;

type AddDialogState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; integration: AgentFeedIntegrationView };

type ErrorLogState = { open: false } | { open: true; integrationId: string };

const PROVIDER_LABELS: Record<FeedProvider, string> = {
  reapit: "Reapit",
  alto: "Alto",
  jupix: "Jupix",
};

const PROVIDER_DESCRIPTIONS: Record<FeedProvider, string> = {
  reapit: "Reapit Agency Cloud — leading UK estate agency CRM",
  alto: "Alto CRM — Jupix-integrated cloud-based platform",
  jupix: "Jupix — cloud-based estate and lettings software",
};

const DEFAULT_FIELD_MAPPING: Record<string, string> = {
  address: "property.address",
  bedrooms: "property.bedrooms",
  bathrooms: "property.bathrooms",
  price: "property.price",
  description: "property.description",
  images: "property.photos",
  status: "property.status",
  tenure: "property.tenure",
  epc_rating: "property.epc_rating",
};

const SYNC_STATUS_CONFIG: Record<
  SyncStatus,
  { label: string; classes: string; dotClass: string }
> = {
  disconnected: {
    label: "Disconnected",
    classes: "bg-muted dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
  connected: {
    label: "Connected",
    classes: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    dotClass: "bg-green-500",
  },
  syncing: {
    label: "Syncing",
    classes: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    dotClass: "bg-blue-500 animate-pulse",
  },
  error: {
    label: "Error",
    classes: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    dotClass: "bg-red-500",
  },
};

type ErrorLogEntry = {
  timestamp?: string;
  message?: string;
  property?: string;
  [key: string]: unknown;
};

type FeedImportReviewItem = {
  id: string;
  external_id: string;
  external_branch_id: string | null;
  status: string;
  validation_errors: string[];
  listing: {
    title: string;
    address_line1: string;
    city: string;
    postcode: string;
    price: number;
    listing_type: string;
    planning_permission_status: string | null;
  };
};

type FeedImportReview = {
  run: {
    id: string;
    status: string;
    total_items: number;
    eligible_items: number;
    error_items: number;
    published_items: number;
  };
  items: FeedImportReviewItem[];
};

export function FeedIntegrationConfig({ initialIntegrations }: Props) {
  const [integrations, setIntegrations] = useState<AgentFeedIntegrationView[]>(initialIntegrations);
  const [dialogState, setDialogState] = useState<AddDialogState>({ open: false });
  const [errorLogState, setErrorLogState] = useState<ErrorLogState>({ open: false });
  const [review, setReview] = useState<FeedImportReview | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);

  // Form state
  const [formProvider, setFormProvider] = useState<FeedProvider>("reapit");
  const [formApiKey, setFormApiKey] = useState("");
  const [formFieldMapping, setFormFieldMapping] = useState<Record<string, string>>(
    DEFAULT_FIELD_MAPPING,
  );
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Sync/delete state
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openAddDialog() {
    setFormProvider("reapit");
    setFormApiKey("");
    setFormFieldMapping(DEFAULT_FIELD_MAPPING);
    setFormError(null);
    setTestResult(null);
    setDialogState({ open: true, mode: "add" });
  }

  function openEditDialog(integration: AgentFeedIntegrationView) {
    setFormProvider(integration.provider);
    setFormApiKey("");
    const mapping = (integration.field_mapping ?? {}) as Record<string, string>;
    setFormFieldMapping(
      Object.keys(mapping).length > 0 ? mapping : DEFAULT_FIELD_MAPPING,
    );
    setFormError(null);
    setTestResult(null);
    setDialogState({ open: true, mode: "edit", integration });
  }

  function closeDialog() {
    setDialogState({ open: false });
    setFormSubmitting(false);
    setFormError(null);
    setTestResult(null);
  }

  async function handleTestConnection() {
    if (!formApiKey.trim()) {
      setTestResult({ ok: false, message: "Enter an API key to test the connection." });
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      // Validate format: most providers use alphanumeric keys 16+ chars
      const isValidFormat = /^[A-Za-z0-9\-_]{8,}$/.test(formApiKey.trim());
      if (!isValidFormat) {
        setTestResult({
          ok: false,
          message: "API key format appears invalid. Expected alphanumeric key (8+ characters).",
        });
        return;
      }
      setTestResult({
        ok: true,
        message:
          "API key format validated. Full connection test requires valid provider credentials.",
      });
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleSave() {
    if (!formApiKey.trim() && dialogState.open && dialogState.mode === "add") {
      setFormError("API key is required.");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const isEdit = dialogState.open && dialogState.mode === "edit";

      if (isEdit) {
        const body: Record<string, unknown> = {
          id: dialogState.integration.id,
          field_mapping: formFieldMapping,
        };
        if (formApiKey.trim()) {
          body.api_key = formApiKey.trim();
        }
        const res = await fetch("/api/agent/feeds", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          setFormError(json.error ?? "Failed to update integration.");
          return;
        }
        const updated = (await res.json()) as AgentFeedIntegrationView;
        setIntegrations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        // POST /api/agent/feeds — create new integration
        const body: Record<string, unknown> = {
          provider: formProvider,
          api_key: formApiKey.trim(),
          field_mapping: formFieldMapping,
        };
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
      }
      closeDialog();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleSyncNow(integrationId: string) {
    setSyncingId(integrationId);
    setFlowError(null);
    setPublishedCount(0);
    try {
      const res = await fetch(
        `/api/agent/feeds/${encodeURIComponent(integrationId)}/sync`,
        { method: "POST" },
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

      const payload = (await res.json()) as {
        published_count: number;
        review: FeedImportReview;
      };
      setPublishedCount(payload.published_count);
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
      // DELETE /api/agent/feeds?id=<id>
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

  const activeErrorLogIntegration =
    errorLogState.open
      ? integrations.find((i) => i.id === errorLogState.integrationId)
      : null;
  const reviewItems = review?.items ?? [];
  const approvedItems = reviewItems.filter((item) => item.status === "approved");
  const errorItems = reviewItems.filter((item) => item.validation_errors.length > 0);
  const withdrawnItems = reviewItems.filter((item) => item.status === "withdrawn");
  const draftCount = publishedCount || review?.run.published_items || 0;
  const activeStep = draftCount > 0 ? "Publish" : review ? "Review" : "Connect";

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Property Feed Integrations
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect your estate agent software to sync property listings automatically.
            Supports Reapit, Alto, and Jupix.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddDialog}
          className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          Add Integration
        </button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {(["Connect", "Review", "Publish"] as const).map((step, index) => (
          <div
            key={step}
            className={`rounded-lg border p-4 ${
              activeStep === step
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                  activeStep === step
                    ? "bg-blue-600 text-white"
                    : "bg-surface text-gray-500 dark:bg-gray-800"
                }`}
              >
                {index + 1}
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {step}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {step === "Connect" &&
                `${integrations.length} feed connection${integrations.length === 1 ? "" : "s"}`}
              {step === "Review" &&
                `${review?.run.eligible_items ?? 0} eligible, ${errorItems.length} with errors`}
              {step === "Publish" &&
                `${draftCount} draft listing${draftCount === 1 ? "" : "s"} created`}
            </p>
          </div>
        ))}
      </div>

      {flowError && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {flowError}
        </div>
      )}

      {review && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Review Imported Listings
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Branch {reviewItems[0]?.external_branch_id ?? "unknown"} · {review.run.total_items} detected · {withdrawnItems.length} withdrawn
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApproveReview}
                disabled={approving || review.run.eligible_items === 0}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-surface disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {approving ? "Approving..." : "Approve Eligible"}
              </button>
              <button
                type="button"
                onClick={handlePublishReview}
                disabled={publishing || approvedItems.length === 0}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish Approved"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-muted dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Listing
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Validation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reviewItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.listing.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.external_id} · {item.listing.address_line1}, {item.listing.city} {item.listing.postcode} · £{item.listing.price.toLocaleString("en-GB")}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-surface px-2 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {item.validation_errors.length === 0 ? (
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                          Ready
                        </span>
                      ) : (
                        <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
                          {item.validation_errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      {dialogState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {dialogState.mode === "edit" ? "Edit Integration" : "Add Feed Integration"}
              </h3>

              {formError && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              {/* Provider selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provider
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["reapit", "alto", "jupix"] as FeedProvider[]).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setFormProvider(provider)}
                      className={`rounded-lg border-2 p-3 text-left transition-colors ${
                        formProvider === provider
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`h-6 w-6 rounded text-xs font-bold flex items-center justify-center text-white ${
                            provider === "reapit"
                              ? "bg-blue-600"
                              : provider === "alto"
                                ? "bg-purple-600"
                                : "bg-orange-600"
                          }`}
                        >
                          {provider[0]?.toUpperCase()}
                        </span>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {PROVIDER_LABELS[provider]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {PROVIDER_DESCRIPTIONS[provider]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div className="mb-4">
                <label
                  htmlFor="feed-api-key"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  API Key{" "}
                  {dialogState.mode === "edit" && (
                    <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    id="feed-api-key"
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Enter your provider API key"
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </button>
                </div>
                {testResult && (
                  <p
                    className={`mt-1.5 text-xs ${
                      testResult.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {testResult.ok ? "✓" : "✗"} {testResult.message}
                  </p>
                )}
              </div>

              {/* Webhook URL (display only) */}
              {dialogState.mode === "edit" && dialogState.integration.id && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Webhook URL
                  </label>
                  <div className="rounded-md bg-surface dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                      {typeof window !== "undefined" ? window.location.origin : "https://app.truedeed.co.uk"}
                      /api/agent/feeds/webhook/{dialogState.integration.id}
                    </code>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Configure this URL in your provider&apos;s webhook settings to receive push updates.
                  </p>
                </div>
              )}

              {/* Field Mapping */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Mapping
                </label>
                <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                          Source Field ({PROVIDER_LABELS[formProvider]})
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                          TrueDeed Field
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {Object.entries(formFieldMapping).map(([source, dest]) => (
                        <tr key={source} className="bg-white dark:bg-gray-900">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={source}
                              readOnly
                              className="w-full bg-transparent text-gray-600 dark:text-gray-400 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={dest}
                              onChange={(e) =>
                                setFormFieldMapping((prev) => ({
                                  ...prev,
                                  [source]: e.target.value,
                                }))
                              }
                              className="w-full bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={formSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save Integration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Integration?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will remove the feed connection and stop all syncing. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Log Panel */}
      {errorLogState.open && activeErrorLogIntegration && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Error Log — {PROVIDER_LABELS[activeErrorLogIntegration.provider]}
              </h3>
              <button
                type="button"
                onClick={() => setErrorLogState({ open: false })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(activeErrorLogIntegration.error_log ?? []).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No errors recorded.</p>
              ) : (
                <div className="space-y-3">
                  {(activeErrorLogIntegration.error_log ?? []).slice(-10).map((entry, idx) => {
                    const e = entry as ErrorLogEntry;
                    return (
                      <div
                        key={idx}
                        className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3"
                      >
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            {e.message ?? "Unknown error"}
                          </p>
                          {e.timestamp && (
                            <span className="text-xs text-red-500 dark:text-red-400 shrink-0">
                              {new Date(e.timestamp).toLocaleString("en-GB")}
                            </span>
                          )}
                        </div>
                        {e.property && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Property: {e.property}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Integration cards */}
      {integrations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No feed integrations configured. Add an integration to sync property listings from your
            CRM software.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const statusConfig = SYNC_STATUS_CONFIG[integration.sync_status];
            return (
              <div
                key={integration.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
              >
                {/* Provider header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-8 w-8 rounded text-sm font-bold flex items-center justify-center text-white ${
                        integration.provider === "reapit"
                          ? "bg-blue-600"
                          : integration.provider === "alto"
                            ? "bg-purple-600"
                            : "bg-orange-600"
                      }`}
                    >
                      {integration.provider[0]?.toUpperCase()}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {PROVIDER_LABELS[integration.provider]}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.classes}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Metadata */}
                <div className="space-y-1 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    Last sync:{" "}
                    {integration.last_sync_at
                      ? new Date(integration.last_sync_at).toLocaleString("en-GB")
                      : "Never"}
                  </div>
                  {(integration.error_log ?? []).length > 0 && (
                    <div className="text-red-500 dark:text-red-400">
                      {(integration.error_log ?? []).length} error
                      {(integration.error_log ?? []).length !== 1 ? "s" : ""} recorded
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSyncNow(integration.id)}
                    disabled={syncingId === integration.id || integration.sync_status === "syncing"}
                    className="rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    {syncingId === integration.id ? "Syncing..." : "Sync Now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditDialog(integration)}
                    className="rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800"
                  >
                    Edit
                  </button>
                  {(integration.error_log ?? []).length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setErrorLogState({ open: true, integrationId: integration.id })
                      }
                      className="rounded border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      View Errors
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(integration.id)}
                    className="rounded border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
