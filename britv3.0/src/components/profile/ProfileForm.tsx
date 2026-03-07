"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { profileUpdateSchema } from "@/lib/validators/profile-schemas";
import type { z } from "zod";

type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: "",
      phone: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const { data } = await res.json();
        reset({
          display_name: data.display_name ?? "",
          phone: data.phone ?? "",
        });
      } catch {
        toast.error("Failed to load profile data");
      } finally {
        setInitialLoading(false);
      }
    }
    loadProfile();
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to update profile");
      }

      const { data } = await res.json();
      reset({
        display_name: data.display_name ?? "",
        phone: data.phone ?? "",
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Profile Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            placeholder="Your display name"
            {...register("display_name")}
          />
          {errors.display_name && (
            <p className="text-sm text-destructive">{errors.display_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="+44 7700 900000"
            {...register("phone")}
          />
          <p className="text-xs text-muted-foreground">UK phone format: +44 or 07...</p>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <Button type="submit" disabled={loading || !isDirty}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Card>
  );
}
