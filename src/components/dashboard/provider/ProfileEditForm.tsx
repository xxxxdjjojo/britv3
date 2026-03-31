"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Plus, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceProviderDetails } from "@/services/provider/provider-profile-service";
import type { ServiceCategory } from "@/types/marketplace";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be at most 100 characters"),
  phone: z.string().optional(),
  website: z
    .string()
    .url("Must be a valid URL (include https://)")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(2000, "Bio must be at most 2000 characters")
    .optional(),
  services: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  conveyancing: "Conveyancing",
  surveying: "Surveying",
  mortgage_broker: "Mortgage Broker",
  moving_company: "Moving Company",
  home_inspector: "Home Inspector",
  cleaning: "Cleaning",
  handyman: "Handyman",
  plumber: "Plumber",
  electrician: "Electrician",
  landscaping: "Landscaping",
  interior_design: "Interior Design",
  architect: "Architect",
  property_management: "Property Management",
  pest_control: "Pest Control",
  locksmith: "Locksmith",
  builder: "Builder",
  plasterer: "Plasterer",
  painter: "Painter",
  carpenter: "Carpenter",
  other: "Other",
};

const ALL_CATEGORIES = Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ProfileEditFormProps = Readonly<{
  profile: ServiceProviderDetails;
  userId: string;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileEditForm({ profile, userId }: ProfileEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url ?? null,
  );
  const [qualificationInput, setQualificationInput] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      business_name: profile.business_name ?? "",
      phone: profile.phone ?? "",
      website: profile.website ?? "",
      description: profile.description ?? "",
      services: profile.services ?? [],
    },
  });

  const descriptionValue = watch("description") ?? "";
  const selectedServices = watch("services") ?? [];

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const res = await fetch("/api/providers/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    }
  }

  // ── Service category toggle ────────────────────────────────────────────────
  function toggleService(cat: ServiceCategory) {
    const current = selectedServices;
    const updated = current.includes(cat)
      ? current.filter((s) => s !== cat)
      : [...current, cat];
    setValue("services", updated, { shouldValidate: true });
  }

  // ── Qualification management ───────────────────────────────────────────────
  function addQualification() {
    const trimmed = qualificationInput.trim();
    if (!trimmed) return;
    setQualifications((prev) => [...prev, trimmed]);
    setQualificationInput("");
  }

  function removeQualification(index: number) {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/providers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: data.business_name,
          phone: data.phone ?? null,
          website: data.website ?? null,
          description: data.description ?? null,
          services: data.services ?? [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to save profile");
      }

      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Form column */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 lg:col-span-2"
      >
        {/* Business Identity section */}
        <section aria-labelledby="section-identity">
          <h2
            id="section-identity"
            className="mb-5 font-headline text-base font-semibold text-primary"
          >
            Business Identity
          </h2>

          {/* Avatar */}
          <div className="mb-6 space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 transition-colors hover:border-brand-primary hover:bg-brand-primary-lighter"
                aria-label="Upload profile photo"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-8 text-neutral-400" />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <Upload className="size-5 text-white" />
                </div>
              </button>
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Click to upload a profile photo
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  JPG, PNG — max 5 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Business Name */}
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="business_name">
              Business Name <span className="text-error">*</span>
            </Label>
            <Input
              id="business_name"
              placeholder="Your business name"
              {...register("business_name")}
              aria-invalid={!!errors.business_name}
              className="h-10"
            />
            {errors.business_name && (
              <p className="text-xs text-error">{errors.business_name.message}</p>
            )}
          </div>

          {/* Phone + Website */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7700 900000"
                {...register("phone")}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                {...register("website")}
                aria-invalid={!!errors.website}
                className="h-10"
              />
              {errors.website && (
                <p className="text-xs text-error">{errors.website.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Bio section */}
        <section aria-labelledby="section-bio">
          <h2
            id="section-bio"
            className="mb-5 font-headline text-base font-semibold text-primary"
          >
            Professional Bio
          </h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Bio</Label>
              <span
                className={[
                  "text-xs tabular-nums",
                  descriptionValue.length > 1900
                    ? "text-error"
                    : "text-neutral-400",
                ].join(" ")}
              >
                {descriptionValue.length} / 2000
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Describe your business, experience, and what sets you apart..."
              className="min-h-32 resize-y"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-error">{errors.description.message}</p>
            )}
          </div>
        </section>

        {/* Qualifications section */}
        <section aria-labelledby="section-quals">
          <h2
            id="section-quals"
            className="mb-5 font-headline text-base font-semibold text-primary"
          >
            Qualifications &amp; Accreditations
          </h2>
          <div className="space-y-2">
            <Label htmlFor="qualification-input">Add qualification</Label>
            <div className="flex gap-2">
              <Input
                id="qualification-input"
                placeholder="e.g. Gas Safe Registered, NVQ Level 3"
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addQualification();
                  }
                }}
                className="h-10"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addQualification}
                aria-label="Add qualification"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {qualifications.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {qualifications.map((q, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-full bg-brand-primary-lighter px-3 py-1 text-xs font-medium text-brand-primary"
                  >
                    {q}
                    <button
                      type="button"
                      onClick={() => removeQualification(i)}
                      className="ml-0.5 rounded-full hover:text-error"
                      aria-label={`Remove ${q}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Service Categories section */}
        <section aria-labelledby="section-services">
          <h2
            id="section-services"
            className="mb-5 font-headline text-base font-semibold text-primary"
          >
            Service Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = selectedServices.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleService(cat)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-brand-primary bg-brand-primary-lighter text-brand-primary"
                      : "border-neutral-200 text-neutral-600 hover:border-brand-primary/40 hover:text-neutral-900",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {SERVICE_CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end border-t border-outline-variant/20 pt-6">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-36 bg-primary text-white hover:bg-primary-container"
          >
            {isSaving ? "Saving..." : "Publish Updates"}
          </Button>
        </div>
      </form>

      {/* Live Preview */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Live Preview
          </p>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            {/* Avatar */}
            <div className="mb-5 flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-brand-primary-lighter">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-8 text-brand-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="font-heading text-sm font-semibold text-neutral-900">
                  {watch("business_name") || "Your Business Name"}
                </p>
                {watch("phone") && (
                  <p className="mt-0.5 text-xs text-neutral-500">{watch("phone")}</p>
                )}
                {watch("website") && (
                  <p className="mt-0.5 truncate text-xs text-brand-accent">
                    {watch("website")}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {descriptionValue && (
              <p className="mb-4 line-clamp-4 text-xs leading-relaxed text-neutral-600">
                {descriptionValue}
              </p>
            )}

            {/* Services */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedServices.slice(0, 5).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-brand-primary-lighter px-2 py-0.5 text-[11px] font-medium text-brand-primary"
                  >
                    {SERVICE_CATEGORY_LABELS[cat as ServiceCategory]}
                  </span>
                ))}
                {selectedServices.length > 5 && (
                  <span className="text-[11px] text-neutral-400">
                    +{selectedServices.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-center text-[11px] text-neutral-400">
            This is how clients see your profile
          </p>
        </div>
      </aside>
    </div>
  );
}
