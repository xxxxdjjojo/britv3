"use client";

import { useState } from "react";

type ApiKey = {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

export function ApiKeyManager(
  props: Readonly<{ initialKeys: ApiKey[] }>,
) {
  const [keys, setKeys] = useState<ApiKey[]>(props.initialKeys);
  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newFullKey, setNewFullKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/agent/billing?action=generate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate key");

      setNewFullKey(data.key);

      // Refresh key list
      const listRes = await fetch("/api/agent/billing?type=api-keys");
      const listData = await listRes.json();
      if (listRes.ok && listData.keys) {
        setKeys(listData.keys);
      }

      setKeyName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(keyId: string, name: string) {
    if (!window.confirm(`Revoke API key "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/agent/billing?action=revoke-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_id: keyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to revoke key");

      // Refresh key list
      const listRes = await fetch("/api/agent/billing?type=api-keys");
      const listData = await listRes.json();
      if (listRes.ok && listData.keys) {
        setKeys(listData.keys);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke key");
    }
  }

  function handleCopy() {
    if (newFullKey) {
      navigator.clipboard.writeText(newFullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function dismissKeyReveal() {
    setNewFullKey(null);
    setShowForm(false);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          API Keys
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage API keys for programmatic access to your estate agent data.
          Keys are hashed and cannot be recovered after creation.
        </p>
      </div>

      {/* New key reveal box */}
      {newFullKey && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-900/30">
          <p className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            This is the only time you will see the full key. Copy it now.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-yellow-100 px-3 py-2 font-mono text-sm text-yellow-900 dark:bg-yellow-800/40 dark:text-yellow-100">
              {newFullKey}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={dismissKeyReveal}
            className="mt-3 text-sm text-yellow-700 underline hover:text-yellow-900 dark:text-yellow-300"
          >
            I have copied my key
          </button>
        </div>
      )}

      {/* Generate new key */}
      {!newFullKey && (
        <div>
          {showForm ? (
            <form onSubmit={handleGenerate} className="flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="key-name"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Key Name
                </label>
                <input
                  id="key-name"
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Feed Sync"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setKeyName(""); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Generate New Key
            </button>
          )}
        </div>
      )}

      {/* Keys table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Prefix</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Rate Limit</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Created</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Last Used</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Usage</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {keys.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No API keys yet. Generate one to get started.
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr
                key={k.id}
                className={k.is_active ? "" : "text-gray-400 dark:text-gray-500"}
              >
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {k.key_prefix}...
                </td>
                <td className="px-4 py-3">60/min</td>
                <td className="px-4 py-3">{formatDate(k.created_at)}</td>
                <td className="px-4 py-3">{formatDate(k.last_used_at)}</td>
                <td className="px-4 py-3">{k.usage_count.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {k.is_active ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Revoked {k.revoked_at ? formatDate(k.revoked_at) : ""}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {k.is_active && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id, k.name)}
                      className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
    </div>
  );
}
