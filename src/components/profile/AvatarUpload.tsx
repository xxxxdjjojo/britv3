"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/utils/compress-image";

export function AvatarUpload() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [initials, setInitials] = useState("U");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadAvatar() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const { data } = await res.json();
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.display_name) {
          const parts = data.display_name.split(" ");
          setInitials(
            parts
              .slice(0, 2)
              .map((p: string) => p[0])
              .join("")
              .toUpperCase(),
          );
        }
      } catch {
        // Silently fail -- avatar will show fallback
      }
    }
    loadAvatar();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    setProgress(20);

    try {
      // Client-side compression
      const compressed = await compressImage(file, 500, 800);
      setProgress(50);

      // Upload to server
      const formData = new FormData();
      formData.append("file", compressed, "avatar.jpg");

      const res = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
      });

      setProgress(90);

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Upload failed");
      }

      const { data } = await res.json();
      setAvatarUrl(data.avatar_url);
      setProgress(100);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Profile Picture</h2>
      <div className="flex items-center gap-6">
        <Avatar className="size-24">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Profile picture" />
          ) : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Camera className="mr-2 size-4" />
            )}
            {uploading ? "Uploading..." : "Change Picture"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP. Max 5MB. Will be resized to 400x400.
          </p>
          {uploading && progress > 0 && (
            <Progress value={progress} className="h-1.5 w-48" />
          )}
        </div>
      </div>
    </Card>
  );
}
