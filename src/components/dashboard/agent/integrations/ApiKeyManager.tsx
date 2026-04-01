"use client";

import { useState } from "react";
import type { AgentApiKey } from "@/types/agent";

type ApiKeyRow = Omit<AgentApiKey, "key_hash">;

type Props = Readonly<{
  initialKeys: ApiKeyRow[];
}>;

type GenerateState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "revealed"; key: string; name: string }
  | { status: "error"; message: string };

export function ApiKeyManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generateState, setGenerateState] = useState<GenerateState>({ status: "idle" });
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!newKeyName.trim()) return;
    setGenerateState({ status: "generating" });
    try {
      // action is a query param; name goes in the request body
      const res = await fetch("/api/agent/billing?action=generate_key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setGenerateState({ status: "error", message: json.error ?? "Failed to generate key" });
        return;
      }
      const json = (await res.json()) as { key: string };
      setGenerateState({ status: "revealed", key: json.key, name: newKeyName.trim() });
      // Refresh key list — GET ?type=keys returns a direct array of ApiKeyRow
      const listRes = await fetch("/api/agent/billing?type=keys");
      if (listRes.ok) {
        const listJson = (await listRes.json()) as ApiKeyRow[];
        if (Array.isArray(listJson)) {
          setKeys(listJson);
        }
      }
    } catch {
      setGenerateState({ status: "error", message: "Network error. Please try again." });
    }
  }

  async function handleRevoke(keyId: string) {
    setRevoking(keyId);
    try {
      // keyId is a query param; DELETE has no body
      const res = await fetch(`/api/agent/billing?keyId=${encodeURIComponent(keyId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) =>
            k.id === keyId
              ? { ...k, is_active: false, revoked_at: new Date().toISOString() }
              : k,
          ),
        );
      }
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCloseDialog() {
    setShowDialog(false);
    setNewKeyName("");
    setGenerateState({ status: "idle" });
    setCopied(false);
  }

  const hasRevealed = generateState.status === "revealed";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-on-surface dark:text-gray-100">API Keys</h2>
          <p className="mt-1 text-sm text-[--color-on-surface-variant] dark:text-gray-400">
            API keys allow programmatic access to your Britestate account for custom integrations,
            automations, and third-party tools. Keep your keys secret — treat them like passwords.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
        >
          Generate New Key
        </button>
      </div>

      {/* Generate Key Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-surface-container-lowest dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-on-surface dark:text-gray-100 mb-4">
              {hasRevealed ? "API Key Generated" : "Generate API Key"}
            </h3>

            {generateState.status === "idle" || generateState.status === "generating" || generateState.status === "error" ? (
              <>
                {generateState.status === "error" && (
                  <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                    {generateState.message}
                  </div>
                )}
                <div className="mb-4">
                  <label
                    htmlFor="key-name"
                    className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1"
                  >
                    Key Name
                  </label>
                  <input
                    id="key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My CRM Integration"
                    className="w-full rounded-md border border-[--color-outline-variant] dark:border-gray-700 bg-surface-container-lowest dark:bg-gray-800 px-3 py-2 text-sm text-on-surface dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="rounded-md border border-[--color-outline-variant] dark:border-gray-600 px-4 py-2 text-sm font-medium text-on-surface dark:text-gray-300 hover:bg-[--color-surface-container-low] dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!newKeyName.trim() || generateState.status === "generating"}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generateState.status === "generating" ? "Generating..." : "Generate"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* One-time key reveal */}
                <div className="mb-4 rounded-md bg-brand-secondary-light dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-4">
                  <p className="text-sm font-semibold text-[--color-brand-secondary-dark] dark:text-amber-200 mb-2">
                    This is the only time you will see the full key. Copy it now.
                  </p>
                  <p className="text-xs text-[--color-brand-secondary-dark] dark:text-amber-300 mb-3">
                    After closing this dialog, only the first 8 characters will be visible.
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-surface-container-lowest dark:bg-gray-800 border border-amber-200 dark:border-amber-700 px-3 py-2">
                    <code className="flex-1 break-all text-xs font-mono text-on-surface dark:text-gray-100">
                      {generateState.key}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(generateState.key)}
                      className="ml-2 rounded bg-blue-100 dark:bg-blue-900 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 shrink-0"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="rounded-md bg-on-surface dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-on-surface/80 dark:hover:bg-gray-200"
                  >
                    I have copied my key
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-surface-container-lowest dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-on-surface dark:text-gray-100 mb-2">
              Revoke API Key?
            </h3>
            <p className="text-sm text-[--color-on-surface-variant] dark:text-gray-400 mb-6">
              This key will immediately stop working. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRevoke(null)}
                className="rounded-md border border-[--color-outline-variant] dark:border-gray-600 px-4 py-2 text-sm font-medium text-on-surface dark:text-gray-300 hover:bg-[--color-surface-container-low] dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRevoke(confirmRevoke)}
                disabled={revoking === confirmRevoke}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {revoking === confirmRevoke ? "Revoking..." : "Revoke Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys Table */}
      {keys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[--color-outline-variant] dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-[--color-on-surface-variant] dark:text-gray-400">
            No API keys yet. Generate your first key to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[--color-outline-variant] dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-[--color-surface-container-low] dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Key Prefix</th>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Rate Limit</th>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Created</th>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Last Used</th>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Usage</th>
                <th className="px-4 py-3 text-left font-medium text-[--color-on-surface-variant] dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right font-medium text-[--color-on-surface-variant] dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-outline-variant] dark:divide-gray-800">
              {keys.map((key) => (
                <tr
                  key={key.id}
                  className={
                    key.is_active
                      ? "bg-surface-container-lowest dark:bg-gray-900"
                      : "bg-[--color-surface-container-low] dark:bg-gray-800/30 opacity-60"
                  }
                >
                  <td className="px-4 py-3 font-medium text-on-surface dark:text-gray-100">
                    {key.name}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-[--color-surface-container-low] dark:bg-gray-800 px-2 py-0.5 text-xs font-mono text-on-surface dark:text-gray-300">
                      {key.key_prefix}...
                    </code>
                  </td>
                  <td className="px-4 py-3 text-on-surface dark:text-gray-300">
                    {key.rate_limit_per_minute}/min
                  </td>
                  <td className="px-4 py-3 text-[--color-on-surface-variant] dark:text-gray-400">
                    {new Date(key.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-[--color-on-surface-variant] dark:text-gray-400">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString("en-GB")
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-on-surface dark:text-gray-300">
                    {key.usage_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {key.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[--color-surface-container-high] dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-[--color-on-surface-variant] dark:text-gray-400">
                        Revoked{" "}
                        {key.revoked_at
                          ? new Date(key.revoked_at).toLocaleDateString("en-GB")
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {key.is_active && (
                      <button
                        type="button"
                        onClick={() => setConfirmRevoke(key.id)}
                        className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
