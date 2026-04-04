"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { useAdminAction } from "@/hooks/useAdminAction";
import { Tag, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type PromoCode = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  uses_count: number | null;
  max_uses: number | null;
  valid_until: string | null;
  applies_to: string | null;
};

type Props = Readonly<{
  promoCodes: PromoCode[];
}>;

type CreateForm = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  max_uses: string;
  valid_from: string;
  valid_until: string;
  applies_to: string;
};

const EMPTY_FORM: CreateForm = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  max_uses: "",
  valid_from: "",
  valid_until: "",
  applies_to: "",
};

export function PromoCodesClient({ promoCodes }: Props) {
  const router = useRouter();
  const { execute, isPending } = useAdminAction();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  function updateForm(field: keyof CreateForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.discount_value) {
      toast.error("Code and discount value are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
          valid_from: form.valid_from || null,
          valid_until: form.valid_until || null,
          applies_to: form.applies_to || null,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Failed to create promo code");
      }

      toast.success("Promo code created");
      setForm(EMPTY_FORM);
      setShowCreate(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promo code?")) return;
    await execute(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {showCreate ? (
            <>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              New Promo Code
            </>
          )}
        </Button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-neutral-200 p-4 space-y-4 bg-neutral-50"
        >
          <h3 className="font-semibold text-neutral-800">Create Promo Code</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => updateForm("code", e.target.value)}
                placeholder="SUMMER20"
                className="uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Discount Type *</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) =>
                  updateForm("discount_type", v ?? "")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount_value">
                Discount Value *
              </Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => updateForm("discount_value", e.target.value)}
                placeholder={form.discount_type === "percentage" ? "20" : "5.00"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max_uses">Max Uses</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => updateForm("max_uses", e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valid_from">Valid From</Label>
              <Input
                id="valid_from"
                type="date"
                value={form.valid_from}
                onChange={(e) => updateForm("valid_from", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={form.valid_until}
                onChange={(e) => updateForm("valid_until", e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="applies_to">Applies To</Label>
              <Input
                id="applies_to"
                value={form.applies_to}
                onChange={(e) => updateForm("applies_to", e.target.value)}
                placeholder="e.g. premium_plan, all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {creating ? "Creating..." : "Create Code"}
            </Button>
          </div>
        </form>
      )}

      {promoCodes.length === 0 ? (
        <AdminEmptyState
          icon={Tag}
          title="No promo codes"
          description="Create promo codes to offer discounts to your users."
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Code
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Discount
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Uses
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Valid Until
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {promoCodes.map((code) => (
                <tr key={code.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono font-medium text-neutral-800">
                    {code.code}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {code.discount_type === "percentage"
                      ? `${code.discount_value}%`
                      : `£${code.discount_value.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {code.uses_count ?? 0}
                    {code.max_uses ? ` / ${code.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {code.valid_until
                      ? new Date(code.valid_until).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "No expiry"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-error hover:text-error/80 hover:border-error/30"
                      onClick={() => handleDelete(code.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
