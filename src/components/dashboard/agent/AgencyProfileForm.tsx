"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Resolver } from "react-hook-form";
import { agencyProfileSchema } from "@/types/agent";
import type { AgentAgencyProfile } from "@/types/agent";
import type { z } from "zod";

// ============================================================================
// Types
// ============================================================================

type FormData = z.infer<typeof agencyProfileSchema>;

type Props = Readonly<{
  profile: AgentAgencyProfile | null;
}>;

// ============================================================================
// Tag input helper
// ============================================================================

function TagInput({
  label,
  tags,
  onAdd,
  onRemove,
  placeholder,
}: Readonly<{
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}>) {
  const [value, setValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && value.trim()) {
      e.preventDefault();
      onAdd(value.trim());
      setValue("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 rounded-md border bg-background p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              aria-label={`Remove ${tag}`}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => {
            if (value.trim()) {
              onAdd(value.trim());
              setValue("");
            }
          }}
          aria-label="Add tag"
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add. Click × to remove.
      </p>
    </div>
  );
}

// ============================================================================
// Main form
// ============================================================================

export function AgencyProfileForm({ profile }: Props) {
  const [specializations, setSpecializations] = useState<string[]>(
    profile?.specializations ?? [],
  );
  const [coverageAreas, setCoverageAreas] = useState<string[]>(
    profile?.coverage_areas ?? [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(agencyProfileSchema) as Resolver<FormData>,
    defaultValues: {
      agency_name: profile?.agency_name ?? "",
      contact_email: profile?.contact_email ?? undefined,
      contact_phone: profile?.contact_phone ?? undefined,
      address_line_1: profile?.address_line_1 ?? undefined,
      address_line_2: profile?.address_line_2 ?? undefined,
      city: profile?.city ?? undefined,
      postcode: profile?.postcode ?? undefined,
      description: profile?.description ?? undefined,
      specializations: profile?.specializations ?? [],
      coverage_areas: profile?.coverage_areas ?? [],
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        specializations,
        coverage_areas: coverageAreas,
      };
      const res = await fetch("/api/agent/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save");
      }

      toast.success("Agency profile saved successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not save profile: ${msg}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="agency_name">
              Agency name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="agency_name"
              {...register("agency_name")}
              placeholder="TrueDeed Properties Ltd"
              className="mt-1"
            />
            {errors.agency_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.agency_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_email">Contact email</Label>
            <Input
              id="contact_email"
              type="email"
              {...register("contact_email")}
              placeholder="hello@agency.co.uk"
              className="mt-1"
            />
            {errors.contact_email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.contact_email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_phone">Contact phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              {...register("contact_phone")}
              placeholder="020 7000 0000"
              className="mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Agency description</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={4}
              placeholder="Tell clients about your agency, your expertise, and what sets you apart..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address_line_1">Address line 1</Label>
            <Input
              id="address_line_1"
              {...register("address_line_1")}
              placeholder="123 High Street"
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address_line_2">Address line 2</Label>
            <Input
              id="address_line_2"
              {...register("address_line_2")}
              placeholder="Suite 2A"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="London"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              {...register("postcode")}
              placeholder="SW1A 1AA"
              className="mt-1"
            />
            {errors.postcode && (
              <p className="mt-1 text-xs text-red-500">
                {errors.postcode.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specializations and coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expertise &amp; Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagInput
            label="Specializations"
            tags={specializations}
            onAdd={(t) => setSpecializations((prev) => [...new Set([...prev, t])])}
            onRemove={(t) =>
              setSpecializations((prev) => prev.filter((x) => x !== t))
            }
            placeholder="e.g. Residential, Lettings..."
          />
          <TagInput
            label="Coverage areas"
            tags={coverageAreas}
            onAdd={(t) =>
              setCoverageAreas((prev) => [...new Set([...prev, t])])
            }
            onRemove={(t) =>
              setCoverageAreas((prev) => prev.filter((x) => x !== t))
            }
            placeholder="e.g. Kensington, Chelsea..."
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
