"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Plus, X, User, Camera } from "lucide-react";
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
// Sub-components
// ---------------------------------------------------------------------------

/** Eyebrow label used above field inputs inside section cards */
function FieldEyebrow({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
      {children}
    </p>
  );
}

/** Section card shell matching Stitch reference — rounded-xl border card */
function SectionCard({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div
      className={[
        "rounded-xl border border-border bg-white p-6",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {children}
    </div>
  );
}

/** Card header row: title on left, optional badge on right */
function SectionCardHeader({
  title,
  badge,
  subtitle,
}: Readonly<{ title: string; badge?: string; subtitle?: string }>) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold tracking-tight text-neutral-900">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-brand-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-gold-foreground">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      )}
    </div>
  );
}

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
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ── Form column ────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 lg:col-span-2"
      >
        {/* ── Business Identity card ─────────────────────────────────────── */}
        <SectionCard>
          <SectionCardHeader
            title="Business Identity"
            badge="PRIMARY"
            subtitle="Update your core brand details and visual identity."
          />

          {/* Avatar row */}
          <div className="mb-5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutral-300 bg-surface transition-colors hover:border-brand-primary"
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
                <Camera className="size-6 text-neutral-400 group-hover:text-brand-primary transition-colors" />
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="size-4 text-white" />
              </div>
            </button>
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Click to upload a profile photo
              </p>
              <p className="text-xs text-neutral-500">JPG, PNG — max 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Business Name */}
          <div className="mb-4">
            <FieldEyebrow>Business Name</FieldEyebrow>
            <Label htmlFor="business_name" className="sr-only">
              Business Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="business_name"
              placeholder="Your business name"
              {...register("business_name")}
              aria-invalid={!!errors.business_name}
            />
            {errors.business_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.business_name.message}
              </p>
            )}
          </div>

          {/* Phone + Website */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldEyebrow>Phone Number</FieldEyebrow>
              <Label htmlFor="phone" className="sr-only">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7700 900000"
                {...register("phone")}
              />
            </div>
            <div>
              <FieldEyebrow>Website</FieldEyebrow>
              <Label htmlFor="website" className="sr-only">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                {...register("website")}
                aria-invalid={!!errors.website}
              />
              {errors.website && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.website.message}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-end justify-between">
              <FieldEyebrow>Professional Bio</FieldEyebrow>
              <span
                className={[
                  "mb-1 text-[10px]",
                  descriptionValue.length > 1900
                    ? "text-red-500"
                    : "text-neutral-400",
                ].join(" ")}
              >
                {descriptionValue.length} / 2000
              </span>
            </div>
            <Label htmlFor="description" className="sr-only">
              Bio
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your business, experience, and what sets you apart..."
              className="min-h-32 resize-y"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
        </SectionCard>

        {/* ── Credentials & Insurance card ───────────────────────────────── */}
        <SectionCard>
          <SectionCardHeader
            title="Credentials &amp; Insurance"
            subtitle="Add qualifications and certifications to build client trust."
          />

          {/* Qualifications */}
          <div>
            <FieldEyebrow>Qualifications</FieldEyebrow>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Gas Safe Registered, NVQ Level 3"
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addQualification();
                  }
                }}
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
              <div className="mt-2 flex flex-wrap gap-2">
                {qualifications.map((q, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary"
                  >
                    {q}
                    <button
                      type="button"
                      onClick={() => removeQualification(i)}
                      className="ml-0.5 rounded-full hover:text-red-500"
                      aria-label={`Remove ${q}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Service Categories card ────────────────────────────────────── */}
        <SectionCard>
          <SectionCardHeader
            title="Service Categories"
            subtitle="Select the services you offer so clients can find you."
          />
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = selectedServices.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleService(cat)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-neutral-200 text-neutral-600 hover:border-brand-primary/50 hover:text-neutral-900",
                  ].join(" ")}
                >
                  {SERVICE_CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Save actions ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-neutral-400">
            Last saved a few minutes ago
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="min-w-36 bg-brand-primary text-white hover:bg-brand-primary-dark"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      {/* ── Right sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          {/* Live Preview card */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
              Live Preview
            </p>

            {/* Avatar + name */}
            <div className="mb-4 flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-brand-primary/10">
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
                <p className="text-sm font-semibold text-neutral-900">
                  {watch("business_name") || "Your Business Name"}
                </p>
                {watch("phone") && (
                  <p className="text-xs text-neutral-500">{watch("phone")}</p>
                )}
                {watch("website") && (
                  <p className="truncate text-xs text-brand-primary">
                    {watch("website")}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {descriptionValue && (
              <p className="mb-3 line-clamp-4 text-xs leading-relaxed text-neutral-600">
                {descriptionValue}
              </p>
            )}

            {/* Services */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedServices.slice(0, 5).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary"
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
