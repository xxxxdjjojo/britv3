"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, ImageIcon } from "lucide-react";
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

  const beforeSrc = item.before_image_path ? `${bucketBase}${item.before_image_path}` : null;
  const afterSrc = item.after_image_path ? `${bucketBase}${item.after_image_path}` : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="group relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(26,28,28,0.05)] transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image area — aspect-[4/5] like Stitch design */}
      <div className="aspect-[4/5] overflow-hidden bg-surface-container relative">
        {afterSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={afterSrc}
            alt={`${item.title} — after`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : beforeSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={beforeSrc}
            alt={`${item.title} — before`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center text-on-surface-variant">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {/* Drag handle overlay */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="absolute top-3 right-3 p-1.5 bg-black/40 text-white rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Card content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-on-surface leading-tight truncate">
              {item.title}
            </h3>
            {item.category && (
              <p className="text-sm text-on-surface-variant mt-1">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </p>
            )}
          </div>
          {item.is_featured && (
            <span className="px-3 py-1 bg-primary-fixed text-[0.6875rem] font-bold text-primary-container rounded-full uppercase tracking-wider shrink-0 ml-2">
              Featured
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">{item.description}</p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-surface-container">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-error transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={item.is_featured}
              onChange={(e) => onToggleFeatured(item.id, e.target.checked)}
              aria-label={item.is_featured ? "Remove from featured" : "Set as featured"}
            />
            <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            <span className="ml-3 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">
              {item.is_featured ? "Visible" : "Hidden"}
            </span>
          </label>
        </div>
      </div>
    </article>
  );
}
