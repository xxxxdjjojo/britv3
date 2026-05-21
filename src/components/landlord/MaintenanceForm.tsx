/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  maintenanceRequestSchema,
  MAINTENANCE_PRIORITIES,
} from "@/types/landlord";
import type { MaintenanceRequestFormData } from "@/types/landlord";
import { validateFileType } from "@/lib/file-validation";
import { compressImage } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";

type PhotoPreview = Readonly<{
  file: File;
  previewUrl: string;
}>;

export function MaintenanceForm(
  props: Readonly<{ propertyId: string }>,
) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MaintenanceRequestFormData>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const titleValue = watch("title");
  const descriptionValue = watch("description");

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (photos.length >= 3) {
        toast.error("Maximum 3 photos allowed");
        break;
      }

      const validation = await validateFileType(file);
      if (!validation.valid || !validation.mimeType?.startsWith("image/")) {
        toast.error(`${file.name}: Only JPEG and PNG images are allowed`);
        continue;
      }

      try {
        const compressed = await compressImage(file, { maxSizeMB: 0.5 });
        const previewUrl = URL.createObjectURL(compressed);
        setPhotos((prev) => [...prev.slice(0, 2), { file: compressed, previewUrl }]);
      } catch {
        toast.error(`Failed to process ${file.name}`);
      }
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(data: MaintenanceRequestFormData) {
    setIsSubmitting(true);

    try {
      // 1. Create maintenance request via API
      const res = await fetch(
        `/api/properties/${props.propertyId}/maintenance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create request");
      }

      const record = await res.json();

      // 2. Upload photos to Supabase Storage via client SDK
      if (photos.length > 0) {
        const supabase = createClient();
        const photoUrls: string[] = [];

        for (const photo of photos) {
          const filePath = `${props.propertyId}/${record.id}/${Date.now()}-${photo.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("maintenance-photos")
            .upload(filePath, photo.file, {
              contentType: photo.file.type,
              upsert: false,
            });

          if (uploadError) {
            console.error("Photo upload failed:", uploadError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage
            .from("maintenance-photos")
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }

        // 3. PATCH request to add photo_urls
        if (photoUrls.length > 0) {
          await fetch(`/api/maintenance/${record.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo_urls: photoUrls }),
          });
        }
      }

      toast.success("Maintenance request created");

      // Navigate to the maintenance list
      window.location.href = `/dashboard/landlord/properties/${props.propertyId}/maintenance`;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          maxLength={200}
          {...register("title")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.title && (
            <p className="text-xs text-red-600">{errors.title.message}</p>
          )}
          <p className="ml-auto text-xs text-gray-400">
            {titleValue?.length ?? 0}/200
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          {...register("description")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.description && (
            <p className="text-xs text-red-600">
              {errors.description.message}
            </p>
          )}
          <p className="ml-auto text-xs text-gray-400">
            {descriptionValue?.length ?? 0}/2000
          </p>
        </div>
      </div>

      {/* Priority */}
      <div>
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Priority
        </label>
        <select
          id="priority"
          {...register("priority")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {MAINTENANCE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        {errors.priority && (
          <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>
        )}
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Photos (up to 3, max 1MB each)
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div key={photo.previewUrl} className="relative">
              <img
                src={photo.previewUrl}
                alt={`Preview ${index + 1}`}
                className="h-24 w-24 rounded-md border object-cover dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                aria-label={`Remove photo ${index + 1}`}
              >
                x
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500">
              <span className="text-2xl">+</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </label>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Request"}
        </button>
      </div>
    </form>
  );
}
