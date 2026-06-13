"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export function ProviderAssignment(
  props: Readonly<{
    requestId: string;
    currentProviderId: string | null;
    currentProviderName: string | null;
  }>,
) {
  const [providerName, setProviderName] = useState("");
  const [providerId, setProviderId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();

    if (!providerName.trim()) {
      toast.error("Provider name is required");
      return;
    }

    setIsAssigning(true);

    try {
      const res = await fetch(`/api/maintenance/${props.requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_provider_id: providerId.trim() || undefined,
          assigned_provider_name: providerName.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to assign provider");
      }

      toast.success("Provider assigned");
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Contractor Assignment
      </h3>

      {props.currentProviderName ? (
        <div className="mt-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Assigned to:{" "}
            <span className="font-medium">{props.currentProviderName}</span>
          </p>
          {props.currentProviderId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: {props.currentProviderId}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Unassigned
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/marketplace/search?category=maintenance"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-surface dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Find Provider
        </Link>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-surface dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Assign Manually
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAssign} className="mt-3 space-y-3">
          <div>
            <label
              htmlFor="provider-name"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Provider Name *
            </label>
            <input
              id="provider-name"
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="e.g., ABC Plumbing Ltd"
            />
          </div>
          <div>
            <label
              htmlFor="provider-id"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Provider User ID (optional)
            </label>
            <input
              id="provider-id"
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="UUID from marketplace"
            />
          </div>
          <button
            type="submit"
            disabled={isAssigning}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAssigning ? "Assigning..." : "Assign Provider"}
          </button>
        </form>
      )}
    </div>
  );
}
