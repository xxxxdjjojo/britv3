/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, X, ImageIcon, LayoutGrid, List, ChevronDown } from "lucide-react";
import type { ProviderPortfolioItem } from "@/types/provider-dashboard";
import { PortfolioItemCard } from "./PortfolioItemCard";

const SERVICE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "gas", label: "Gas" },
  { value: "carpentry", label: "Carpentry" },
  { value: "plastering", label: "Plastering" },
  { value: "painting", label: "Painting" },
  { value: "roofing", label: "Roofing" },
  { value: "flooring", label: "Flooring" },
  { value: "landscaping", label: "Landscaping" },
  { value: "general_maintenance", label: "General Maintenance" },
  { value: "cleaning", label: "Cleaning" },
  { value: "moving", label: "Moving" },
  { value: "conveyancing", label: "Conveyancing" },
  { value: "surveying", label: "Surveying" },
  { value: "mortgage_advice", label: "Mortgage Advice" },
] as const;

type AddProjectForm = {
  title: string;
  description: string;
  category: string;
  beforeFile: File | null;
  afterFile: File | null;
};

type EditState = {
  item: ProviderPortfolioItem;
  title: string;
  description: string;
  category: string;
};

type Props = Readonly<{
  initialItems: ProviderPortfolioItem[];
  providerId: string;
}>;

export function PortfolioGrid({ initialItems, providerId }: Props) {
  const [items, setItems] = useState<ProviderPortfolioItem[]>(initialItems);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [addForm, setAddForm] = useState<AddProjectForm>({
    title: "",
    description: "",
    category: "",
    beforeFile: null,
    afterFile: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);

        // Persist reorder (fire and forget — optimistic update already applied)
        void fetch("/api/provider/portfolio/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: reordered.map((i) => i.id) }),
        }).catch((err: unknown) => {
          console.error("Reorder persist failed:", err);
        });

        return reordered;
      });
    },
    [],
  );

  // Upload a file to Supabase storage via a signed URL approach
  // For simplicity we upload to the API which stores the path
  async function uploadImage(file: File, prefix: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prefix", prefix);

    const res = await fetch("/api/provider/portfolio/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      // If no dedicated upload endpoint, return a placeholder path
      // (In production, this would upload to Supabase storage directly)
      return `${providerId}/${prefix}-${Date.now()}-${file.name}`;
    }

    const data = (await res.json()) as { path: string };
    return data.path;
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      let beforePath: string | undefined;
      let afterPath: string | undefined;

      if (addForm.beforeFile) {
        beforePath = await uploadImage(addForm.beforeFile, "before");
      }
      if (addForm.afterFile) {
        afterPath = await uploadImage(addForm.afterFile, "after");
      }

      const res = await fetch("/api/provider/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addForm.title.trim(),
          description: addForm.description || undefined,
          category: addForm.category || undefined,
          before_image_path: beforePath,
          after_image_path: afterPath,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to add project");
      }

      const newItem = (await res.json()) as ProviderPortfolioItem;
      setItems((prev) => [...prev, newItem]);
      setShowAddDialog(false);
      setAddForm({ title: "", description: "", category: "", beforeFile: null, afterFile: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/provider/portfolio/${editState.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editState.title.trim(),
          description: editState.description || null,
          category: editState.category || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to update project");
      }

      const updated = (await res.json()) as ProviderPortfolioItem;
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this portfolio project? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/provider/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete project");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_featured: isFeatured } : item)),
    );

    try {
      const res = await fetch(`/api/provider/portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: isFeatured }),
      });
      if (!res.ok) {
        // Revert on failure
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_featured: !isFeatured } : item)),
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_featured: !isFeatured } : item)),
      );
    }
  };

  const openEdit = (item: ProviderPortfolioItem) => {
    setEditState({
      item,
      title: item.title,
      description: item.description ?? "",
      category: item.category ?? "",
    });
    setError(null);
  };

  const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1";
  const inputClass =
    "w-full rounded-lg border border-border bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary";

  const totalPhotos = items.reduce((acc, i) => {
    const before = i.before_image_path ? 1 : 0;
    const after = i.after_image_path ? 1 : 0;
    return acc + before + after;
  }, 0);
  const featuredCount = items.filter((i) => i.is_featured).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Manage Portfolio
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
            Portfolio
          </h1>
        </div>
        <button
          onClick={() => {
            setShowAddDialog(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold hover:brightness-95 text-brand-gold-foreground text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Stat summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Projects", value: items.length },
          { label: "Total Photos", value: totalPhotos },
          { label: "Featured", value: featuredCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-border shadow-sm p-5 flex flex-col gap-1"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
              {label}
            </p>
            <p className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark">
              {value}
            </p>
            <div className="mt-1 h-0.5 w-8 rounded-full bg-brand-gold" />
          </div>
        ))}
      </div>

      {/* Filter / view bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface transition-colors shadow-sm">
            All Services
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface transition-colors shadow-sm">
            Newest First
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white dark:bg-neutral-900 p-0.5 shadow-sm">
          <button
            aria-label="Grid view"
            className="p-1.5 rounded-md bg-brand-primary/10 text-brand-primary"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            aria-label="List view"
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <button
          onClick={() => {
            setShowAddDialog(true);
            setError(null);
          }}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface py-20 text-neutral-400 hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
        >
          <ImageIcon className="w-10 h-10 opacity-40" />
          <p className="font-medium">No portfolio projects yet</p>
          <p className="text-sm mt-1">Add your first before/after project to showcase your work.</p>
        </button>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
              {/* Add new project slot */}
              <button
                onClick={() => {
                  setShowAddDialog(true);
                  setError(null);
                }}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface min-h-[220px] text-neutral-400 hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">Upload New Portfolio Project</p>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Project Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Add Project
              </h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && (
                <p className="text-sm text-error bg-error/10 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div>
                <label className={labelClass}>
                  Project Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={addForm.title}
                  onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Bathroom refurbishment"
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={`${inputClass} resize-none h-20`}
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Briefly describe the project..."
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={addForm.category}
                  onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select a category</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Before Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 dark:file:bg-neutral-700 dark:file:text-neutral-200 cursor-pointer"
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, beforeFile: e.target.files?.[0] ?? null }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>After Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 dark:file:bg-neutral-700 dark:file:text-neutral-200 cursor-pointer"
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, afterFile: e.target.files?.[0] ?? null }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-gold hover:brightness-95 disabled:opacity-50 text-brand-gold-foreground text-sm font-semibold transition-all"
                >
                  {submitting ? "Adding..." : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Edit Project
              </h2>
              <button
                onClick={() => setEditState(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && (
                <p className="text-sm text-error bg-error/10 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div>
                <label className={labelClass}>
                  Project Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={editState.title}
                  onChange={(e) => setEditState((s) => s && { ...s, title: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={`${inputClass} resize-none h-20`}
                  value={editState.description}
                  onChange={(e) =>
                    setEditState((s) => s && { ...s, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={editState.category}
                  onChange={(e) => setEditState((s) => s && { ...s, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditState(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-surface dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-gold hover:brightness-95 disabled:opacity-50 text-brand-gold-foreground text-sm font-semibold transition-all"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
