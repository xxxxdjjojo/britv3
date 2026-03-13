"use client";

import { useState } from "react";
import type { AgentBranch, CreateBranchInput } from "@/types/agent";

type BranchWithCount = AgentBranch & { member_count: number };

const EMPTY_FORM: CreateBranchInput = {
  name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  postcode: "",
  phone: "",
  email: "",
  is_head_office: false,
};

export function BranchManager(
  props: Readonly<{ initialBranches: BranchWithCount[] }>,
) {
  const [branches, setBranches] = useState(props.initialBranches);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateBranchInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(branch: AgentBranch) {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      address_line_1: branch.address_line_1 ?? "",
      address_line_2: branch.address_line_2 ?? "",
      city: branch.city ?? "",
      postcode: branch.postcode ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      is_head_office: branch.is_head_office,
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function updateField<K extends keyof CreateBranchInput>(
    key: K,
    value: CreateBranchInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing branch
        const res = await fetch("/api/agent/team", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, type: "branch", ...form }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to update branch");
        }
        const { branch } = await res.json();
        setBranches((prev) =>
          prev.map((b) =>
            b.id === editingId ? { ...branch, member_count: b.member_count } : b,
          ),
        );
      } else {
        // Create new branch
        const res = await fetch("/api/agent/team?type=branch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to create branch");
        }
        const { branch } = await res.json();
        setBranches((prev) => [{ ...branch, member_count: 0 }, ...prev]);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Management</h1>
          <p className="text-muted-foreground">
            Manage your office branches and locations
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Branch
        </button>
      </div>

      {/* Branch Form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {editingId ? "Edit Branch" : "Add New Branch"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. London Bridge Office"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="branch@agency.co.uk"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={form.address_line_1 ?? ""}
                  onChange={(e) => updateField("address_line_1", e.target.value)}
                  placeholder="Street address"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={form.address_line_2 ?? ""}
                  onChange={(e) => updateField("address_line_2", e.target.value)}
                  placeholder="Suite, unit, etc."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  City
                </label>
                <input
                  type="text"
                  value={form.city ?? ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Postcode
                </label>
                <input
                  type="text"
                  value={form.postcode ?? ""}
                  onChange={(e) => updateField("postcode", e.target.value)}
                  placeholder="SW1A 1AA"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone ?? ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="020 7946 0000"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_head_office ?? false}
                    onChange={(e) => updateField("is_head_office", e.target.checked)}
                    className="size-4 rounded border"
                  />
                  Head Office
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update Branch"
                    : "Create Branch"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      )}

      {/* Branch Cards */}
      {branches.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No branches yet. Add your first branch to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{branch.name}</h3>
                    {branch.is_head_office && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Head Office
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEditForm(branch)}
                  className="rounded border px-2 py-1 text-xs hover:bg-accent"
                >
                  Edit
                </button>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {(branch.address_line_1 || branch.city || branch.postcode) && (
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                    </svg>
                    <span>
                      {[branch.address_line_1, branch.city, branch.postcode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>{branch.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  {branch.member_count} team member{branch.member_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
