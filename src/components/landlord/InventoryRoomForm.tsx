"use client";

/**
 * InventoryRoomForm — reusable per-room form for inventory check-in/check-out reports.
 * Handles condition select, notes textarea, and photo uploads to the
 * landlord-documents private bucket.
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, AlertCircle } from "lucide-react";

// -- Types -------------------------------------------------------------------

export type RoomCondition = "excellent" | "good" | "fair" | "poor" | "damaged";

export type RoomEntry = {
  name: string;
  condition: RoomCondition;
  notes: string;
  photoUrls: string[];
};

type Props = Readonly<{
  roomName: string;
  reportId: string | null; // null = report not yet saved; photos upload after save
  initialCondition?: RoomCondition;
  initialNotes?: string;
  initialPhotoUrls?: string[];
  onUpdate: (data: RoomEntry) => void;
}>;

// -- Constants ---------------------------------------------------------------

const CONDITIONS: { value: RoomCondition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" },
];

const CONDITION_COLORS: Record<RoomCondition, string> = {
  excellent: "text-success",
  good: "text-success",
  fair: "text-warning",
  poor: "text-warning",
  damaged: "text-error",
};

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// -- Component ---------------------------------------------------------------

export function InventoryRoomForm({
  roomName,
  reportId,
  initialCondition = "good",
  initialNotes = "",
  initialPhotoUrls = [],
  onUpdate,
}: Props) {
  const [condition, setCondition] = useState<RoomCondition>(initialCondition);
  const [notes, setNotes] = useState(initialNotes);
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialPhotoUrls);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Notify parent of any field change
  const notify = useCallback(
    (
      overrides: Partial<{ condition: RoomCondition; notes: string; photoUrls: string[] }>,
    ) => {
      const entry: RoomEntry = {
        name: roomName,
        condition: overrides.condition ?? condition,
        notes: overrides.notes ?? notes,
        photoUrls: overrides.photoUrls ?? photoUrls,
      };
      onUpdate(entry);
    },
    [condition, notes, photoUrls, roomName, onUpdate],
  );

  const handleConditionChange = (val: string) => {
    const c = val as RoomCondition;
    setCondition(c);
    notify({ condition: c });
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    notify({ notes: val });
  };

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!reportId) return; // can't upload until report is saved

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("Not authenticated — please refresh the page.");
        return;
      }

      const roomSlug = roomName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filePath = `${user.id}/inventory/${reportId}/${roomSlug}/${Date.now()}-${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("landlord-documents")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) {
        setUploadError(`Upload failed: ${uploadErr.message}`);
        return;
      }

      // Generate a 1-year signed URL (private bucket — no public URL)
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("landlord-documents")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedErr || !signedData?.signedUrl) {
        setUploadError("Could not generate signed URL for uploaded photo.");
        return;
      }

      const newUrls = [...photoUrls, signedData.signedUrl];
      setPhotoUrls(newUrls);
      notify({ photoUrls: newUrls });
    },
    [reportId, roomName, photoUrls, notify],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploadError(null);

      const remaining = MAX_PHOTOS - photoUrls.length;
      const toUpload = acceptedFiles.slice(0, remaining);

      if (toUpload.length === 0) {
        setUploadError(`Maximum ${MAX_PHOTOS} photos per room.`);
        return;
      }

      if (!reportId) {
        setUploadError(
          "Save a draft first before uploading photos.",
        );
        return;
      }

      setUploadingCount(toUpload.length);
      await Promise.all(toUpload.map(uploadPhoto));
      setUploadingCount(0);
    },
    [photoUrls.length, reportId, uploadPhoto],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_PHOTOS,
    disabled: !reportId || photoUrls.length >= MAX_PHOTOS,
  });

  const removePhoto = (url: string) => {
    const newUrls = photoUrls.filter((u) => u !== url);
    setPhotoUrls(newUrls);
    notify({ photoUrls: newUrls });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      {/* Room name */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{roomName}</h4>
        {condition !== "good" && condition !== "excellent" && (
          <span className={`text-xs font-medium ${CONDITION_COLORS[condition]}`}>
            {condition.charAt(0).toUpperCase() + condition.slice(1)}
          </span>
        )}
      </div>

      {/* Condition */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Condition</Label>
        <Select value={condition} onValueChange={handleConditionChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">
          Notes — fixtures, furnishings, condition details
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Describe the condition of fixtures, furnishings, walls, floor..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Photo upload */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">
          Photos ({photoUrls.length}/{MAX_PHOTOS})
        </Label>

        {/* Thumbnails */}
        {photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url) => (
              <div
                key={url}
                className="group relative size-16 overflow-hidden rounded border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Room photo"
                  className="size-full object-cover"
                />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dropzone */}
        {photoUrls.length < MAX_PHOTOS && (
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              !reportId
                ? "cursor-not-allowed border-muted opacity-50"
                : isDragActive
                  ? "border-brand-primary bg-brand-primary-lighter/30"
                  : "border-border hover:border-brand-primary/50 hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            {uploadingCount > 0 ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
            <p className="text-xs text-muted-foreground">
              {uploadingCount > 0
                ? `Uploading ${uploadingCount} photo${uploadingCount > 1 ? "s" : ""}...`
                : !reportId
                  ? "Save a draft first to enable photo uploads"
                  : "Drop photos here or click to browse (JPG, PNG, max 10 MB)"}
            </p>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-center gap-1.5 text-xs text-error">
            <AlertCircle className="size-3.5" />
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}

// -- Condition comparison helper ---------------------------------------------

const CONDITION_ORDER: Record<RoomCondition, number> = {
  excellent: 5,
  good: 4,
  fair: 3,
  poor: 2,
  damaged: 1,
};

/**
 * Returns true if `current` condition is worse than `baseline` condition.
 * Used by check-out page to highlight deterioration.
 */
export function isConditionWorse(
  current: RoomCondition,
  baseline: RoomCondition,
): boolean {
  return CONDITION_ORDER[current] < CONDITION_ORDER[baseline];
}
