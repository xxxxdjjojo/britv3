"use client";

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { GripVertical, X, Upload } from "lucide-react";
import { WizardShell } from "./WizardShell";
import type { SellerListing, ListingPhoto } from "@/types/seller";
import { createClient } from "@/lib/supabase/client";

type LocalPhoto = ListingPhoto & { localId: string };

type SortablePhotoProps = Readonly<{
  photo: LocalPhoto;
  onRemove: (localId: string) => void;
}>;

function SortablePhoto({ photo, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.localId });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden bg-muted aspect-square">
      <Image src={photo.url} alt="" fill className="object-cover" sizes="(max-width: 640px) 33vw, 25vw" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 rounded-lg bg-white/80 text-slate-600 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        onClick={() => onRemove(photo.localId)}
        className="absolute top-2 right-2 p-1 rounded-lg bg-white/80 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove photo"
      >
        <X size={14} />
      </button>
      {photo.order === 0 && (
        <span className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-primary text-white">
          Cover
        </span>
      )}
    </div>
  );
}

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
  listingId: string;
}>;

export function Step3Photos({ listing, listingId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<LocalPhoto[]>(
    (listing?.photos ?? []).map((p, i) => ({ ...p, localId: `existing-${i}` })),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError("");
    let failCount = 0;
    for (const file of acceptedFiles.slice(0, 30 - photos.length)) {
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 2048 });
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `listings/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(path, compressed, { contentType: file.type });
        if (uploadError) { failCount++; continue; }
        const { data: { publicUrl } } = supabase.storage
          .from("listing-images")
          .getPublicUrl(path);
        setPhotos((prev) => [
          ...prev,
          { url: publicUrl, order: prev.length, localId: `new-${Date.now()}-${Math.random()}` },
        ]);
      } catch {
        failCount++;
      }
    }
    if (failCount > 0) {
      setError(`${failCount} photo(s) failed to upload. Successfully uploaded photos were saved.`);
    }
    setUploading(false);
  }, [photos.length, listingId, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const tooBig = rejections.some((r) => r.errors.some((e) => e.code === "file-too-large"));
      if (tooBig) setError("One or more files exceed the 20MB size limit.");
    },
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/heic": [], "image/heif": [] },
    maxFiles: 30,
    maxSize: 20 * 1024 * 1024,
    disabled: uploading || photos.length >= 30,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPhotos((prev) => {
      const oldIndex = prev.findIndex((p) => p.localId === active.id);
      const newIndex = prev.findIndex((p) => p.localId === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((p, i) => ({ ...p, order: i }));
    });
  };

  const removePhoto = (localId: string) =>
    setPhotos((prev) => prev.filter((p) => p.localId !== localId).map((p, i) => ({ ...p, order: i })));

  const handleContinue = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: photos.map(({ url, order }) => ({ url, order })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save photos");
      router.push(`/dashboard/seller/listings/create?step=4&id=${listingId}`);
    } catch {
      setError("Failed to save photos. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardShell step={3} listingId={listingId} onContinue={() => void handleContinue()} isLoading={saving}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Photos & Media</h2>
          <p className="text-slate-500 text-sm mt-1">Add up to 30 photos. Drag to reorder — the first photo is the cover image.</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-slate-200 hover:border-slate-300 bg-surface"
          } ${photos.length >= 30 ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-slate-500">
            {uploading ? (
              <div className="h-8 w-8 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin" />
            ) : (
              <Upload size={32} className="text-slate-300" />
            )}
            <p className="text-sm font-medium">
              {uploading ? "Uploading..." : isDragActive ? "Drop here" : "Drop photos or click to upload"}
            </p>
            <p className="text-xs text-slate-400">JPEG, PNG, WebP, HEIC · Max 20MB per file · {photos.length}/30 added</p>
          </div>
        </div>

        {photos.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map((p) => p.localId)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <SortablePhoto key={photo.localId} photo={photo} onRemove={removePhoto} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </WizardShell>
  );
}
