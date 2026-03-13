"use client";

import { useState } from "react";
import type { AgentFeedIntegration, FeedProvider, SyncStatus } from "@/types/agent";
import { FEED_PROVIDERS } from "@/types/agent";

const PROVIDER_META: Record<FeedProvider, { label: string; icon: string }> = {
  reapit: { label: "Reapit", icon: "\uD83C\uDFE0" },
  alto: { label: "Alto", icon: "\uD83C\uDFE2" },
  jupix: { label: "Jupix", icon: "\uD83D\uDCCB" },
};

const STATUS_BADGE: Record<SyncStatus, string> = {
  disconnected: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  connected: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  syncing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function FeedIntegrationConfig(
  props: Readonly<{ initialIntegrations: AgentFeedIntegration[] }>,
) {
  const [integrations, setIntegrations] = useState<AgentFeedIntegration[]>(
    props.initialIntegrations,
  );
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<FeedProvider>("reapit");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  async function refreshList() {
    const res = await fetch("/api/agent/feeds");
    const data = await res.json();
    if (res.ok && data.integrations) {
      setIntegrations(data.integrations);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/agent/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create integration");

      await refreshList();
      setShowForm(false);
      setApiKey("");
      setProvider("reapit");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create integration");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, providerName: string) {
    if (!window.confirm(`Delete ${providerName} integration? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/agent/feeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete integration");

      await refreshList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete integration");
    }
  }

  function toggleErrors(id: string) {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Property Feed Integrations
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Connect your property management system to automatically sync listings.
        </p>
      </div>

      {/* Add integration form */}
      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Add Integration
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="feed-provider"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Provider
              </label>
              <select
                id="feed-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as FeedProvider)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {FEED_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_META[p].icon} {PROVIDER_META[p].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="feed-api-key"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                API Key
              </label>
              <input
                id="feed-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter provider API key"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setApiKey(""); }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Integration
        </button>
      )}

      {/* Integration cards */}
      {integrations.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No feed integrations configured. Add one to start syncing properties.
        </p>
      )}

      <div className="space-y-4">
        {integrations.map((integ) => {
          const meta = PROVIDER_META[integ.provider] ?? {
            label: integ.provider,
            icon: "\uD83D\uDD17",
          };
          const statusClass = STATUS_BADGE[integ.sync_status] ?? STATUS_BADGE.disconnected;
          const errorsExpanded = expandedErrors.has(integ.id);

          return (
            <div
              key={integ.id}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last sync: {formatDate(integ.last_sync_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                  >
                    {integ.sync_status}
                  </span>

                  {integ.error_log.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleErrors(integ.id)}
                      className="text-xs font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400"
                    >
                      {errorsExpanded ? "Hide Error Log" : `View Error Log (${integ.error_log.length})`}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(integ.id, meta.label)}
                    className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Error log */}
              {errorsExpanded && integ.error_log.length > 0 && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <h4 className="mb-2 text-sm font-medium text-red-800 dark:text-red-300">
                    Error Log
                  </h4>
                  <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
                    {integ.error_log.map((entry, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="shrink-0 text-red-500">
                          {(entry as Record<string, unknown>).timestamp
                            ? String((entry as Record<string, unknown>).timestamp)
                            : `#${idx + 1}`}
                        </span>
                        <span>
                          {(entry as Record<string, unknown>).message
                            ? String((entry as Record<string, unknown>).message)
                            : JSON.stringify(entry)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
