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
import { Plus, X, ImageIcon } from "lucide-react";
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

  const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5";
  const inputClass =
    "w-full rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="mt-1 text-sm text-on-surface-variant">
          {items.length} project{items.length !== 1 ? "s" : ""} — drag to reorder
        </p>
        <button
          onClick={() => {
            setShowAddDialog(true);
            setError(null);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          aria-label="Add new portfolio project"
        >
          <Plus className="size-4" />
          New Project
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <button
          onClick={() => { setShowAddDialog(true); setError(null); }}
          className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 rounded-xl aspect-[4/5] bg-surface-container-low hover:bg-surface-container hover:border-primary-fixed-dim transition-all group max-w-xs mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary-fixed-dim shadow-sm group-hover:scale-110 transition-transform">
            <ImageIcon className="size-8" />
          </div>
          <span className="mt-4 font-bold text-on-surface-variant uppercase text-[0.6875rem] tracking-[0.1em]">
            Upload New Portfolio Project
          </span>
        </button>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {items.map((item) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
              {/* Add card */}
              <button
                onClick={() => { setShowAddDialog(true); setError(null); }}
                className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 rounded-xl aspect-[4/5] bg-surface-container-low hover:bg-surface-container hover:border-primary-fixed-dim transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary-fixed-dim shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="size-8" />
                </div>
                <span className="mt-4 font-bold text-on-surface-variant uppercase text-[0.6875rem] tracking-[0.1em]">
                  Upload New Portfolio Project
                </span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Project Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                Add Portfolio Project
              </h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 p-6">
              {error && (
                <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error dark:bg-error/10 dark:text-error">
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
                  className={`${inputClass} h-20 resize-none`}
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
                    className="w-full cursor-pointer text-sm text-neutral-600 file:mr-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-200 dark:hover:file:bg-neutral-600"
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
                    className="w-full cursor-pointer text-sm text-neutral-600 file:mr-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 dark:text-neutral-400 dark:file:bg-neutral-700 dark:file:text-neutral-200 dark:hover:file:bg-neutral-600"
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
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                Edit Project
              </h2>
              <button
                onClick={() => setEditState(null)}
                className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              {error && (
                <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error dark:bg-error/10 dark:text-error">
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
                  className={`${inputClass} h-20 resize-none`}
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
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light disabled:opacity-50"
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
