"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type AvatarUploaderProps = Readonly<{
  userId: string;
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
}>;

export function AvatarUploader({
  userId: _userId,
  avatarUrl: initialAvatarUrl,
  firstName,
  lastName,
}: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "?";

  function handleClick() {
    if (uploading || removing) return;
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";

    // Client-side validation
    const MAX_SIZE = 819200; // 800 KB
    if (file.size > MAX_SIZE) {
      toast.error("File must be 800 KB or smaller");
      return;
    }
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      toast.error("Only JPEG and PNG images are supported");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/settings/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMsg =
          data !== null &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to upload photo";
        toast.error(errorMsg);
        return;
      }

      const avatarData = data as { avatar_url: string };
      setAvatarUrl(avatarData.avatar_url);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (removing) return;
    setRemoving(true);
    try {
      const response = await fetch("/api/settings/profile/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data: unknown = await response.json();
        const errorMsg =
          data !== null &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to remove photo";
        toast.error(errorMsg);
        return;
      }

      setAvatarUrl(null);
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setRemoving(false);
    }
  }

  const isLoading = uploading || removing;

  return (
    <div className="flex items-center gap-4">
      {/* Avatar circle with hover overlay */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="group relative h-20 w-20 shrink-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed"
        aria-label="Change profile photo"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile photo"
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 font-heading text-xl font-semibold text-brand-primary">
            {initials}
          </span>
        )}

        {/* Hover / loading overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 aria-busy:opacity-100">
          {isLoading ? (
            <Loader2 className="size-6 animate-spin text-white" />
          ) : (
            <Camera className="size-6 text-white" />
          )}
        </span>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Remove button */}
      <div className="flex flex-col gap-1">
        <p className="font-body text-sm font-medium text-foreground">
          Profile photo
        </p>
        <p className="font-body text-xs text-neutral-500">
          JPEG or PNG, max 800 KB
        </p>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading}
            className="mt-1 h-auto justify-start px-0 text-xs text-error hover:bg-transparent hover:text-error/80"
          >
            <X className="size-3" />
            Remove photo
          </Button>
        )}
      </div>
    </div>
  );
}
