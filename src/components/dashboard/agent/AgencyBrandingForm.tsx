"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
  Upload,
  Building,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentAgencyProfile } from "@/types/agent";

// ============================================================================
// Schema
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
// Section wrapper
// ============================================================================

function Section({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
      <div className="bg-neutral-50 px-6 py-4">
        <p className="font-semibold text-neutral-900">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

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
      brand_primary_colour: profile?.brand_primary_colour ?? "#1B4D3E",
      brand_secondary_colour: profile?.brand_secondary_colour ?? "#7B5804",
      social_facebook: profile?.social_facebook ?? undefined,
      social_twitter: profile?.social_twitter ?? undefined,
      social_instagram: profile?.social_instagram ?? undefined,
      social_linkedin: profile?.social_linkedin ?? undefined,
      website_url: profile?.website_url ?? undefined,
      description: profile?.description ?? undefined,
    },
  });

  const primaryColour = watch("brand_primary_colour") ?? "#1B4D3E";
  const secondaryColour = watch("brand_secondary_colour") ?? "#7B5804";
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

  const socialLinks = [
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
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Live preview */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
        <div className="bg-neutral-50 px-6 py-4">
          <p className="font-semibold text-neutral-900">Preview</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            How your brand appears across the platform
          </p>
        </div>
        <div className="p-6">
          <div
            className="flex items-center gap-5 rounded-2xl p-5"
            style={{ backgroundColor: primaryColour }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Agency logo"
                className="size-16 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex size-16 items-center justify-center rounded-xl shadow-sm"
                style={{ backgroundColor: secondaryColour }}
              >
                <Building className="size-7 text-white" />
              </div>
            )}
            <div>
              <p className="font-heading text-lg font-bold tracking-tight text-white">
                {agencyName}
              </p>
              <p className="text-sm text-white/70">Estate Agents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logo upload */}
      <Section
        title="Agency Logo"
        description="PNG, JPG or WebP up to 5 MB — compressed to 400px automatically"
      >
        <div className="flex items-center gap-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Current logo"
              className="size-24 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-primary/30 bg-brand-primary-lighter text-brand-primary transition-all hover:border-brand-primary hover:bg-brand-primary-lighter/70"
            >
              <Upload className="size-6" />
              <span className="text-[10px] font-semibold">Upload</span>
            </button>
          )}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              {uploading ? "Uploading…" : "Choose file"}
            </Button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="text-xs text-neutral-400 hover:text-error transition-colors"
              >
                Remove logo
              </button>
            )}
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
      </Section>

      {/* Brand colours */}
      <Section
        title="Brand Colours"
        description="Choose your primary and accent colours"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="brand_primary_colour"
              className="text-sm font-medium text-neutral-700"
            >
              Primary colour
            </Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative">
                <input
                  id="brand_primary_colour"
                  type="color"
                  {...register("brand_primary_colour")}
                  className="size-12 cursor-pointer rounded-xl border-0 p-0.5 shadow-sm"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={primaryColour}
                  onChange={() => {}}
                  readOnly
                  className="rounded-lg bg-neutral-50 font-mono text-sm uppercase"
                  aria-label="Primary colour hex value"
                />
              </div>
            </div>
            {errors.brand_primary_colour && (
              <p className="mt-1.5 text-xs text-error">
                {errors.brand_primary_colour.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="brand_secondary_colour"
              className="text-sm font-medium text-neutral-700"
            >
              Secondary colour
            </Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative">
                <input
                  id="brand_secondary_colour"
                  type="color"
                  {...register("brand_secondary_colour")}
                  className="size-12 cursor-pointer rounded-xl border-0 p-0.5 shadow-sm"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={secondaryColour}
                  onChange={() => {}}
                  readOnly
                  className="rounded-lg bg-neutral-50 font-mono text-sm uppercase"
                  aria-label="Secondary colour hex value"
                />
              </div>
            </div>
            {errors.brand_secondary_colour && (
              <p className="mt-1.5 text-xs text-error">
                {errors.brand_secondary_colour.message}
              </p>
            )}
          </div>
        </div>

        {/* Colour swatches preview */}
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-10 flex-1 rounded-xl shadow-inner"
            style={{ backgroundColor: primaryColour }}
          />
          <div
            className="h-10 flex-1 rounded-xl shadow-inner"
            style={{ backgroundColor: secondaryColour }}
          />
          <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-100">
            <Palette className="size-5 text-neutral-400" />
          </div>
        </div>
      </Section>

      {/* Agency description */}
      <Section
        title="Agency Description"
        description="Shown on your public marketplace profile"
      >
        <Textarea
          {...register("description")}
          rows={4}
          placeholder="A brief description shown on your public profile…"
          className="resize-none rounded-lg bg-neutral-50"
        />
        <div className="mt-2 flex items-center justify-between">
          <span />
          <p
            className={`text-xs ${
              descriptionValue.length > 480
                ? "text-error font-medium"
                : "text-neutral-400"
            }`}
          >
            {descriptionValue.length}/500
          </p>
        </div>
        {errors.description && (
          <p className="mt-1 text-xs text-error">
            {errors.description.message}
          </p>
        )}
      </Section>

      {/* Social links */}
      <Section
        title="Social &amp; Web Links"
        description="Connect your online presence"
      >
        <div className="space-y-4">
          {socialLinks.map(({ id, label, icon: Icon, placeholder }) => (
            <div key={id}>
              <Label
                htmlFor={id}
                className="text-sm font-medium text-neutral-700"
              >
                {label}
              </Label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Icon className="size-4 text-neutral-400" />
                </div>
                <Input
                  id={id}
                  type="url"
                  {...register(id)}
                  placeholder={placeholder}
                  className="rounded-lg bg-neutral-50 pl-9"
                />
              </div>
              {errors[id] && (
                <p className="mt-1 text-xs text-error">
                  {errors[id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={isSubmitting || uploading}
          className="rounded-xl bg-brand-primary px-6 text-white hover:bg-brand-primary/90"
        >
          {isSubmitting ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </form>
  );
}
