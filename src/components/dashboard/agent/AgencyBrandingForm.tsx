"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Upload, Building, Globe, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentAgencyProfile } from "@/types/agent";

// ============================================================================
// Schema — only the branding fields
// ============================================================================

const brandingSchema = z.object({
  brand_primary_colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be #RRGGBB")
    .optional(),
  brand_secondary_colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be #RRGGBB")
    .optional(),
  social_facebook: z.string().url("Invalid URL").nullable().optional(),
  social_twitter: z.string().url("Invalid URL").nullable().optional(),
  social_instagram: z.string().url("Invalid URL").nullable().optional(),
  social_linkedin: z.string().url("Invalid URL").nullable().optional(),
  website_url: z.string().url("Invalid URL").nullable().optional(),
  description: z.string().max(500, "Max 500 characters").nullable().optional(),
});

type FormData = z.infer<typeof brandingSchema>;

type Props = Readonly<{
  profile: AgentAgencyProfile | null;
}>;

// ============================================================================
// Main component
// ============================================================================

export function AgencyBrandingForm({ profile }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(
    profile?.logo_url ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      brand_primary_colour: profile?.brand_primary_colour ?? "#1a56db",
      brand_secondary_colour: profile?.brand_secondary_colour ?? "#7e3af2",
      social_facebook: profile?.social_facebook ?? undefined,
      social_twitter: profile?.social_twitter ?? undefined,
      social_instagram: profile?.social_instagram ?? undefined,
      social_linkedin: profile?.social_linkedin ?? undefined,
      website_url: profile?.website_url ?? undefined,
      description: profile?.description ?? undefined,
    },
  });

  const primaryColour = watch("brand_primary_colour") ?? "#1a56db";
  const secondaryColour = watch("brand_secondary_colour") ?? "#7e3af2";
  const agencyName = profile?.agency_name ?? "Your Agency";
  const descriptionValue = watch("description") ?? "";

  // ── Logo upload ────────────────────────────────────────────────────────────

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      const supabase = createClient();
      const path = `logos/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

      const { error: uploadError } = await supabase.storage
        .from("agent-logos")
        .upload(path, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("agent-logos")
        .getPublicUrl(path);

      setLogoUrl(urlData.publicUrl);
      toast.success("Logo uploaded successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(`Logo upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  // ── Form submit ────────────────────────────────────────────────────────────

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data, logo_url: logoUrl };
      const res = await fetch("/api/agent/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save");
      }

      toast.success("Branding saved successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not save branding: ${msg}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Live preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center gap-4 rounded-xl p-4"
            style={{ backgroundColor: primaryColour }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Agency logo"
                className="size-14 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex size-14 items-center justify-center rounded-lg"
                style={{ backgroundColor: secondaryColour }}
              >
                <Building className="size-6 text-white" />
              </div>
            )}
            <div>
              <p className="font-bold text-white">{agencyName}</p>
              <p className="text-xs text-white/80">Estate Agents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Current logo"
                className="size-20 rounded-xl object-cover border"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
                <Building className="size-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 size-4" />
                {uploading ? "Uploading..." : "Upload logo"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG up to 5 MB. Will be compressed to 400px.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoChange}
            className="sr-only"
            aria-label="Upload logo file"
          />
        </CardContent>
      </Card>

      {/* Brand colours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Colours</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="brand_primary_colour">Primary colour</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="brand_primary_colour"
                type="color"
                {...register("brand_primary_colour")}
                className="size-10 cursor-pointer rounded border border-border"
              />
              <Input
                value={primaryColour}
                onChange={() => {}}
                readOnly
                className="w-28 font-mono text-sm"
                aria-label="Primary colour hex value"
              />
            </div>
            {errors.brand_primary_colour && (
              <p className="mt-1 text-xs text-red-500">
                {errors.brand_primary_colour.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="brand_secondary_colour">Secondary colour</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="brand_secondary_colour"
                type="color"
                {...register("brand_secondary_colour")}
                className="size-10 cursor-pointer rounded border border-border"
              />
              <Input
                value={secondaryColour}
                onChange={() => {}}
                readOnly
                className="w-28 font-mono text-sm"
                aria-label="Secondary colour hex value"
              />
            </div>
            {errors.brand_secondary_colour && (
              <p className="mt-1 text-xs text-red-500">
                {errors.brand_secondary_colour.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agency description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("description")}
            rows={4}
            placeholder="A brief description shown on your public profile..."
            className="resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {descriptionValue.length}/500
          </p>
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">
              {errors.description.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Social links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social &amp; Web Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: "website_url" as const,
              label: "Website",
              icon: Globe,
              placeholder: "https://www.youragency.co.uk",
            },
            {
              id: "social_facebook" as const,
              label: "Facebook",
              icon: Facebook,
              placeholder: "https://facebook.com/youragency",
            },
            {
              id: "social_twitter" as const,
              label: "X (Twitter)",
              icon: Twitter,
              placeholder: "https://twitter.com/youragency",
            },
            {
              id: "social_instagram" as const,
              label: "Instagram",
              icon: Instagram,
              placeholder: "https://instagram.com/youragency",
            },
            {
              id: "social_linkedin" as const,
              label: "LinkedIn",
              icon: Linkedin,
              placeholder: "https://linkedin.com/company/youragency",
            },
          ].map(({ id, label, icon: Icon, placeholder }) => (
            <div key={id}>
              <Label htmlFor={id}>{label}</Label>
              <div className="relative mt-1">
                <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={id}
                  type="url"
                  {...register(id)}
                  placeholder={placeholder}
                  className="pl-9"
                />
              </div>
              {errors[id] && (
                <p className="mt-1 text-xs text-red-500">
                  {errors[id]?.message}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Saving..." : "Save branding"}
        </Button>
      </div>
    </form>
  );
}
