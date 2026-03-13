"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { agencyProfileSchema } from "@/types/agent";
import type { AgentAgencyProfile, AgencyProfileFormData } from "@/types/agent";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AgencyProfileForm(
  props: Readonly<{ profile: AgentAgencyProfile | null }>,
) {
  const { profile } = props;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgencyProfileFormData>({
    resolver: zodResolver(agencyProfileSchema),
    defaultValues: {
      agency_name: profile?.agency_name ?? "",
      contact_email: profile?.contact_email ?? "",
      contact_phone: profile?.contact_phone ?? "",
      address_line_1: profile?.address_line_1 ?? "",
      address_line_2: profile?.address_line_2 ?? "",
      city: profile?.city ?? "",
      postcode: profile?.postcode ?? "",
      description: profile?.description ?? "",
      specializations: profile?.specializations ?? [],
      coverage_areas: profile?.coverage_areas ?? [],
    },
  });

  async function onSubmit(data: AgencyProfileFormData) {
    setSaving(true);
    try {
      // Convert comma-separated strings to arrays if needed
      const body = {
        ...data,
        specializations:
          typeof data.specializations === "string"
            ? (data.specializations as unknown as string)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : data.specializations,
        coverage_areas:
          typeof data.coverage_areas === "string"
            ? (data.coverage_areas as unknown as string)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : data.coverage_areas,
      };

      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save profile");
      }

      toast.success("Agency profile saved successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Agency name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agency_name">Agency Name *</Label>
            <Input
              id="agency_name"
              placeholder="e.g. Britestate Properties"
              {...register("agency_name")}
            />
            {errors.agency_name && (
              <p className="text-xs text-destructive">
                {errors.agency_name.message}
              </p>
            )}
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="office@agency.co.uk"
                {...register("contact_email")}
              />
              {errors.contact_email && (
                <p className="text-xs text-destructive">
                  {errors.contact_email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                placeholder="020 1234 5678"
                {...register("contact_phone")}
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                placeholder="123 High Street"
                {...register("address_line_1")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                placeholder="Suite 4"
                {...register("address_line_2")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="London"
                {...register("city")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="SW1A 1AA"
                {...register("postcode")}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Tell potential clients about your agency..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Specializations */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="specializations">
              Specializations (comma-separated)
            </Label>
            <Input
              id="specializations"
              placeholder="Residential sales, Lettings, New builds"
              defaultValue={profile?.specializations?.join(", ") ?? ""}
              {...register("specializations")}
            />
          </div>

          {/* Coverage areas */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coverage_areas">
              Coverage Areas (comma-separated)
            </Label>
            <Input
              id="coverage_areas"
              placeholder="Kensington, Chelsea, Fulham"
              defaultValue={profile?.coverage_areas?.join(", ") ?? ""}
              {...register("coverage_areas")}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
