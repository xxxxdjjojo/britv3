"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { AgentCrmClient, ClientType } from "@/types/agent";

type Tab = "overview" | "properties" | "communication" | "transactions";

const TABS: Readonly<{ key: Tab; label: string }[]> = [
  { key: "overview", label: "Overview" },
  { key: "properties", label: "Properties" },
  { key: "communication", label: "Communication" },
  { key: "transactions", label: "Transactions" },
];

function typeBadgeClass(type: ClientType): string {
  switch (type) {
    case "buyer":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "seller":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "landlord":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "tenant":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

export function ClientProfile(
  props: Readonly<{ initialClient: AgentCrmClient }>,
) {
  const [client, setClient] = useState<AgentCrmClient>(props.initialClient);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Editable fields
  const [editName, setEditName] = useState(client.name);
  const [editEmail, setEditEmail] = useState(client.email ?? "");
  const [editPhone, setEditPhone] = useState(client.phone ?? "");
  const [editNotes, setEditNotes] = useState(client.notes ?? "");

  const startEditing = useCallback(() => {
    setEditName(client.name);
    setEditEmail(client.email ?? "");
    setEditPhone(client.phone ?? "");
    setEditNotes(client.notes ?? "");
    setEditing(true);
    setSaveError("");
  }, [client]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setSaveError("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!editName.trim()) {
      setSaveError("Name is required");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/agent/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: client.id,
          name: editName.trim(),
          email: editEmail.trim() || undefined,
          phone: editPhone.trim() || undefined,
          notes: editNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to update client");
        return;
      }
      setClient(data.client as AgentCrmClient);
      setEditing(false);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [client.id, editName, editEmail, editPhone, editNotes]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/agent/crm"
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        &larr; Back to CRM
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {client.name}
          </h1>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass(client.client_type)}`}
          >
            {client.client_type.charAt(0).toUpperCase() +
              client.client_type.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {client.last_contact_at && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last contact:{" "}
              {new Date(client.last_contact_at).toLocaleDateString("en-GB")}
            </span>
          )}
          {!editing && activeTab === "overview" && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {saveError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {saveError}
            </p>
          )}

          {/* Contact details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Contact Details
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </dt>
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {client.name}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                {editing ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </dt>
                {editing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {client.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {client.client_type.charAt(0).toUpperCase() +
                    client.client_type.slice(1)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Preferences */}
          {Object.keys(client.preferences).length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Preferences
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(client.preferences).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </dt>
                    <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Tags */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tags
            </h2>
            {client.tags && client.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No tags</p>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Notes
            </h2>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Add notes about this client..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                {client.notes ?? "No notes"}
              </p>
            )}
          </div>

          {/* Save / Cancel buttons */}
          {editing && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "properties" && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No linked properties yet
          </p>
        </div>
      )}

      {activeTab === "communication" && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No messages yet
          </p>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No transactions yet
          </p>
        </div>
      )}
    </div>
  );
}
