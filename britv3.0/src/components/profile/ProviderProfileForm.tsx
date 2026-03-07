"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { providerProfileSchema } from "@/services/profile/profile-service";
import type { z } from "zod";

type ProviderFormValues = z.infer<typeof providerProfileSchema>;

export function ProviderProfileForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      services: [{ category: "", description: "" }],
      coverage_postcodes: [],
      pricing: {},
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const [postcodeInput, setPostcodeInput] = useState("");
  const [postcodes, setPostcodes] = useState<string[]>([]);
  const [pricingEntries, setPricingEntries] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" },
  ]);

  useEffect(() => {
    async function loadProviderProfile() {
      try {
        const res = await fetch("/api/service-provider/profile");
        if (!res.ok) {
          setInitialLoading(false);
          return;
        }
        const { data } = await res.json();
        if (data) {
          reset({
            services: data.services?.length ? data.services : [{ category: "", description: "" }],
            coverage_postcodes: data.coverage_postcodes ?? [],
            pricing: data.pricing ?? {},
          });
          if (data.coverage_postcodes) {
            setPostcodes(data.coverage_postcodes);
          }
          if (data.pricing) {
            const entries = Object.entries(data.pricing).map(([key, value]) => ({
              key,
              value: String(value),
            }));
            setPricingEntries(entries.length ? entries : [{ key: "", value: "" }]);
          }
        }
      } catch {
        // Silently handle -- form starts empty
      } finally {
        setInitialLoading(false);
      }
    }
    loadProviderProfile();
  }, [reset]);

  function handleAddPostcode() {
    const trimmed = postcodeInput.trim().toUpperCase();
    if (trimmed && !postcodes.includes(trimmed)) {
      setPostcodes((prev) => [...prev, trimmed]);
    }
    setPostcodeInput("");
  }

  function handleRemovePostcode(pc: string) {
    setPostcodes((prev) => prev.filter((p) => p !== pc));
  }

  async function onSubmit(values: ProviderFormValues) {
    setLoading(true);
    try {
      const pricing: Record<string, number> = {};
      for (const entry of pricingEntries) {
        if (entry.key.trim() && entry.value.trim()) {
          pricing[entry.key.trim()] = parseFloat(entry.value);
        }
      }

      const body = {
        services: values.services,
        coverage_postcodes: postcodes,
        pricing,
      };

      const res = await fetch("/api/service-provider/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to update provider profile");
      }

      toast.success("Provider profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update provider profile");
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
      <h2 className="mb-4 text-lg font-semibold">Provider Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Services */}
        <div className="space-y-3">
          <Label>Services Offered</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Category (e.g. Plumbing)"
                  {...register(`services.${index}.category`)}
                />
                <Textarea
                  placeholder="Description of service"
                  rows={2}
                  {...register(`services.${index}.description`)}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.services && (
            <p className="text-sm text-destructive">
              {errors.services.message ?? "Please check your services"}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ category: "", description: "" })}
          >
            <Plus className="mr-1 size-4" />
            Add Service
          </Button>
        </div>

        {/* Coverage Postcodes */}
        <div className="space-y-2">
          <Label>Coverage Area (Postcodes)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. SW1A"
              value={postcodeInput}
              onChange={(e) => setPostcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPostcode();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddPostcode}>
              Add
            </Button>
          </div>
          {postcodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {postcodes.map((pc) => (
                <span
                  key={pc}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm"
                >
                  {pc}
                  <button
                    type="button"
                    onClick={() => handleRemovePostcode(pc)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <Label>Rate Card</Label>
          {pricingEntries.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Service name"
                value={entry.key}
                onChange={(e) => {
                  const updated = [...pricingEntries];
                  updated[i] = { ...updated[i], key: e.target.value };
                  setPricingEntries(updated);
                }}
              />
              <Input
                placeholder="Price (GBP)"
                type="number"
                min="0"
                step="0.01"
                value={entry.value}
                onChange={(e) => {
                  const updated = [...pricingEntries];
                  updated[i] = { ...updated[i], value: e.target.value };
                  setPricingEntries(updated);
                }}
              />
              {pricingEntries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPricingEntries((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPricingEntries((prev) => [...prev, { key: "", value: "" }])}
          >
            <Plus className="mr-1 size-4" />
            Add Rate
          </Button>
        </div>

        <Button type="submit" disabled={loading || (!isDirty && postcodes.length === 0)}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Provider Profile
        </Button>
      </form>
    </Card>
  );
}
