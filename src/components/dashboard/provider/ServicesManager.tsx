"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import type { ProviderService, PricingType } from "@/types/provider-dashboard";
import { ServiceCard } from "@/components/dashboard/provider/ServiceCard";

const SERVICE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "gas", label: "Gas" },
  { value: "carpentry", label: "Carpentry" },
  { value: "plastering", label: "Plastering" },
  { value: "painting", label: "Painting" },
  { value: "roofing", label: "Roofing" },
  { value: "flooring", label: "Flooring" },
  { value: "landscaping", label: "Landscaping" },
  { value: "general_maintenance", label: "General Maintenance" },
  { value: "cleaning", label: "Cleaning" },
  { value: "moving", label: "Moving" },
  { value: "conveyancing", label: "Conveyancing" },
  { value: "surveying", label: "Surveying" },
  { value: "mortgage_advice", label: "Mortgage Advice" },
] as const;

type FormValues = {
  name: string;
  category: string;
  description: string;
  pricing_type: PricingType;
  price_amount: string; // string for form input, convert to pence on submit
};

const DEFAULT_FORM: FormValues = {
  name: "",
  category: "plumbing",
  description: "",
  pricing_type: "hourly",
  price_amount: "",
};

type ServicesManagerProps = Readonly<{
  initialServices: ProviderService[];
  providerId: string;
}>;

export function ServicesManager({
  initialServices,
  providerId,
}: ServicesManagerProps) {
  const [services, setServices] = useState<ProviderService[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(
    null,
  );
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAddDialog() {
    setEditingService(null);
    setForm(DEFAULT_FORM);
    setError(null);
    setDialogOpen(true);
  }

  function openEditDialog(service: ProviderService) {
    setEditingService(service);
    setForm({
      name: service.name,
      category: service.category,
      description: service.description ?? "",
      pricing_type: service.pricing_type,
      price_amount:
        service.price_amount !== null
          ? String(service.price_amount / 100)
          : "",
    });
    setError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingService(null);
    setForm(DEFAULT_FORM);
    setError(null);
  }

  function handleFieldChange(
    field: keyof FormValues,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }

    const priceAmountPence =
      form.pricing_type !== "quote_on_request" && form.price_amount !== ""
        ? Math.round(parseFloat(form.price_amount) * 100)
        : null;

    if (
      form.pricing_type !== "quote_on_request" &&
      form.price_amount !== "" &&
      isNaN(priceAmountPence!)
    ) {
      setError("Please enter a valid price.");
      return;
    }

    const body = {
      provider_id: providerId,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
      pricing_type: form.pricing_type,
      price_amount: priceAmountPence,
    };

    startTransition(async () => {
      try {
        let res: Response;
        if (editingService) {
          res = await fetch(`/api/provider/services/${editingService.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          res = await fetch("/api/provider/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        const saved = (await res.json()) as ProviderService;

        if (editingService) {
          setServices((prev) =>
            prev.map((s) => (s.id === saved.id ? saved : s)),
          );
        } else {
          setServices((prev) => [...prev, saved]);
        }

        closeDialog();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/provider/services/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          alert("Failed to delete service.");
          return;
        }
        setServices((prev) => prev.filter((s) => s.id !== id));
      } catch {
        alert("Network error. Please try again.");
      }
    });
  }

  const needsPrice = form.pricing_type !== "quote_on_request";

  return (
    <div className="space-y-6">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Services</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Manage the services you offer to clients.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddDialog}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#163d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Plus className="size-4" />
          Add Service
        </button>
      </div>

      {/* Service list */}
      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-surface p-12 text-center">
          <p className="text-sm font-medium text-neutral-500">
            No services added yet
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Add your first service to start receiving enquiries.
          </p>
          <button
            type="button"
            onClick={openAddDialog}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-[#E8F5EE]"
          >
            <Plus className="size-4" />
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={openEditDialog}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDialog}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Dialog header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h2
                id="service-dialog-title"
                className="text-base font-semibold text-neutral-900"
              >
                {editingService ? "Edit Service" : "Add Service"}
              </h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={closeDialog}
                className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="svc-name"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="svc-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="e.g. Boiler installation"
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="svc-category"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="svc-category"
                  value={form.category}
                  onChange={(e) =>
                    handleFieldChange("category", e.target.value)
                  }
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="svc-description"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Description
                </label>
                <textarea
                  id="svc-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  placeholder="Brief description of what this service includes…"
                  className="block w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              {/* Pricing type */}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-neutral-700">
                  Pricing Type <span className="text-red-500">*</span>
                </legend>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { value: "hourly", label: "Hourly rate" },
                      { value: "fixed", label: "Fixed price" },
                      { value: "quote_on_request", label: "Quote on request" },
                    ] as { value: PricingType; label: string }[]
                  ).map(({ value, label }) => (
                    <label
                      key={value}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        form.pricing_type === value
                          ? "border-brand-primary bg-[#E8F5EE] text-brand-primary"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="pricing_type"
                        value={value}
                        checked={form.pricing_type === value}
                        onChange={() => handleFieldChange("pricing_type", value)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Price amount (conditionally shown) */}
              {needsPrice && (
                <div>
                  <label
                    htmlFor="svc-price"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Price (£)
                    {form.pricing_type === "hourly" && (
                      <span className="ml-1 text-neutral-400">per hour</span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-500">
                      £
                    </span>
                    <input
                      id="svc-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price_amount}
                      onChange={(e) =>
                        handleFieldChange("price_amount", e.target.value)
                      }
                      placeholder="0.00"
                      className="block w-full rounded-lg border border-neutral-300 py-2 pl-7 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isPending}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-surface disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#163d31] disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {editingService ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
