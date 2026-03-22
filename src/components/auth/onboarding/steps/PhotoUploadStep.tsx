"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { cn } from "@/lib/utils";
import { Camera, X, Loader2 } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;
const RESIZE_MAX_PX = 1200;

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width <= RESIZE_MAX_PX && height <= RESIZE_MAX_PX) {
        resolve(file);
        return;
      }
      const scale = Math.min(RESIZE_MAX_PX / width, RESIZE_MAX_PX / height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
        "image/webp",
        0.85,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export function PhotoUploadStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: (photoUrl: string) => void;
    onBack: () => void;
    onSkip: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    const result = await saveStep(async (supabase) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const resized = await resizeImage(file);
      const ext = "webp";
      const path = `${user.id}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("agent-photos")
        .upload(path, resized, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("agent-photos").getPublicUrl(path);

      await supabase
        .from("agent_profiles")
        .update({ photo_url: publicUrl })
        .eq("user_id", user.id);

      return publicUrl;
    });

    setUploading(false);
    if (result) props.onSubmit(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Professional Photo
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Add a professional headshot. Profiles with photos get 40% more
          enquiries.
        </p>
      </div>

      {/* Upload zone */}
      {!preview ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors",
            error
              ? "border-red-300 bg-red-50/50"
              : "border-neutral-300 bg-neutral-50 hover:border-brand-primary hover:bg-brand-primary/5",
          )}
        >
          <Camera className="mb-3 size-10 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-600">
            Drop your photo here, or{" "}
            <span className="text-brand-primary underline">browse</span>
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            JPG, PNG, or WebP. Max {MAX_SIZE_MB}MB.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative mx-auto w-48">
          <img
            src={preview}
            alt="Preview"
            className="size-48 rounded-full object-cover border-4 border-brand-primary/20"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setFile(null);
            }}
            className="absolute -right-2 -top-2 rounded-full bg-neutral-900 p-1 text-white hover:bg-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-center text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={props.onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || saving || uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload and Continue"
          )}
        </Button>
      </div>

      <button
        type="button"
        onClick={props.onSkip}
        className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600"
      >
        Skip for now
      </button>
    </div>
  );
}
