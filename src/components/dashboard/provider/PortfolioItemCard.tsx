"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, MapPin, ImageIcon } from "lucide-react";
import type { ProviderPortfolioItem } from "@/types/provider-dashboard";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  gas: "Gas",
  carpentry: "Carpentry",
  plastering: "Plastering",
  painting: "Painting",
  roofing: "Roofing",
  flooring: "Flooring",
  landscaping: "Landscaping",
  general_maintenance: "General Maintenance",
  cleaning: "Cleaning",
  moving: "Moving",
  conveyancing: "Conveyancing",
  surveying: "Surveying",
  mortgage_advice: "Mortgage Advice",
};

type Props = Readonly<{
  item: ProviderPortfolioItem;
  onEdit: (item: ProviderPortfolioItem) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, isFeatured: boolean) => void;
}>;

export function PortfolioItemCard({ item, onEdit, onDelete, onToggleFeatured }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const bucketBase = `${supabaseUrl}/storage/v1/object/public/portfolio/`;

  // Prefer the "after" image as the hero; fall back to "before"
  const heroSrc = item.after_image_path
    ? `${bucketBase}${item.after_image_path}`
    : item.before_image_path
      ? `${bucketBase}${item.before_image_path}`
      : null;

  const categoryLabel = item.category
    ? (CATEGORY_LABELS[item.category] ?? item.category)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white dark:bg-neutral-900 rounded-xl border border-border shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md"
    >
      {/* Hero image */}
      <div className="relative bg-surface dark:bg-neutral-800 h-52 overflow-hidden">
        {heroSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heroSrc}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-600">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}

        {/* Drag handle overlay */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Featured badge */}
        {item.is_featured && (
          <span className="absolute top-2 right-2 z-10 text-[10px] font-bold uppercase tracking-[0.1em] bg-brand-gold text-brand-gold-foreground px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <p className="font-heading font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug flex-1 min-w-0">
            {item.title}
          </p>
          {categoryLabel && (
            <span className="shrink-0 inline-flex items-center text-[10px] font-bold uppercase tracking-[0.08em] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
              {categoryLabel}
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Location placeholder row */}
        <div className="flex items-center gap-1 text-xs text-neutral-400 mt-auto pt-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {item.category ? CATEGORY_LABELS[item.category] ?? item.category : "—"}
          </span>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        {/* Edit / Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            title="Edit project"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            title="Delete project"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visibility / featured toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-400">
            {item.is_featured ? "Visible" : "Hidden"}
          </span>
          <button
            role="switch"
            aria-checked={item.is_featured}
            onClick={() => onToggleFeatured(item.id, !item.is_featured)}
            title={item.is_featured ? "Remove featured" : "Set as featured"}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              item.is_featured
                ? "bg-brand-primary"
                : "bg-neutral-200 dark:bg-neutral-700",
            ].join(" ")}
          >
            <span
              className={[
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                item.is_featured ? "translate-x-4" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
