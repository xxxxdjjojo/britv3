"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Star, StarOff, ImageIcon } from "lucide-react";
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
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Before / After images */}
      <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-700 h-40">
        <div className="relative bg-neutral-100 dark:bg-neutral-800 flex flex-col">
          <span className="absolute top-1 left-1 z-10 text-xs font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
            Before
          </span>
          {beforeSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={beforeSrc}
              alt={`${item.title} — before`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="relative bg-neutral-100 dark:bg-neutral-800 flex flex-col">
          <span className="absolute top-1 left-1 z-10 text-xs font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
            After
          </span>
          {afterSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={afterSrc}
              alt={`${item.title} — after`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="mt-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {item.title}
            </p>
            {item.category && (
              <span className="inline-block mt-0.5 text-xs bg-info-light text-info dark:bg-info/10 dark:text-info px-1.5 py-0.5 rounded-full font-medium">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2 justify-end">
        <button
          onClick={() => onToggleFeatured(item.id, !item.is_featured)}
          title={item.is_featured ? "Remove featured" : "Set as featured"}
          className={[
            "p-1.5 rounded-lg transition-colors",
            item.is_featured
              ? "text-warning hover:text-warning/80 bg-warning-light dark:bg-warning/10"
              : "text-neutral-400 hover:text-warning hover:bg-warning-light dark:hover:bg-warning/10",
          ].join(" ")}
        >
          {item.is_featured ? (
            <Star className="w-4 h-4 fill-current" />
          ) : (
            <StarOff className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onEdit(item)}
          title="Edit project"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-info hover:bg-info-light dark:hover:bg-info/10 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(item.id)}
          title="Delete project"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-error hover:bg-error-light dark:hover:bg-error/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
