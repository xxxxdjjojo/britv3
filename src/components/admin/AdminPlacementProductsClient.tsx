"use client";

import { useState } from "react";

import { PLACEMENT_TYPE_LABELS, type PlacementProduct, type PlacementType } from "@/types/sponsored-placements";

const PLACEMENT_TYPES: PlacementType[] = ["town_boost", "postcode_boost", "property_detail_boost", "category_leader"];

type NewProduct = {
  name: string;
  placement_type: PlacementType;
  town: string;
  region_scope: string;
  postcode_district: string;
  slot_limit: number;
  monthly_price_pence: number;
};

const EMPTY: NewProduct = {
  name: "",
  placement_type: "town_boost",
  town: "",
  region_scope: "",
  postcode_district: "",
  slot_limit: 3,
  monthly_price_pence: 9900,
};

export function AdminPlacementProductsClient({ initialProducts }: Readonly<{ initialProducts: PlacementProduct[] }>) {
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState<NewProduct>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function patch(id: string, body: Partial<PlacementProduct>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/placement-products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not update product.");
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...body } : p)));
    } catch {
      setError("Could not update product. Please try again.");
    }
  }

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/placement-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          placement_type: draft.placement_type,
          town: draft.town || null,
          region_scope: draft.region_scope || null,
          postcode_district: draft.postcode_district || null,
          slot_limit: draft.slot_limit,
          monthly_price_pence: draft.monthly_price_pence,
          status: "active",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not create product");
        return;
      }
      setProducts((prev) => [json as PlacementProduct, ...prev]);
      setDraft(EMPTY);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Create a placement product</h2>
        {error && <p className="mb-3 rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name">
            <input
              className="w-full rounded border px-2 py-1.5"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Ealing Town Boost"
            />
          </Field>
          <Field label="Type">
            <select
              className="w-full rounded border px-2 py-1.5"
              value={draft.placement_type}
              onChange={(e) => setDraft({ ...draft, placement_type: e.target.value as PlacementType })}
            >
              {PLACEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PLACEMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Town">
            <input className="w-full rounded border px-2 py-1.5" value={draft.town} onChange={(e) => setDraft({ ...draft, town: e.target.value })} />
          </Field>
          <Field label="Region">
            <input
              className="w-full rounded border px-2 py-1.5"
              value={draft.region_scope}
              onChange={(e) => setDraft({ ...draft, region_scope: e.target.value })}
            />
          </Field>
          <Field label="Postcode district">
            <input
              className="w-full rounded border px-2 py-1.5"
              value={draft.postcode_district}
              onChange={(e) => setDraft({ ...draft, postcode_district: e.target.value })}
            />
          </Field>
          <Field label="Slot limit">
            <input
              type="number"
              className="w-full rounded border px-2 py-1.5"
              value={draft.slot_limit}
              onChange={(e) => setDraft({ ...draft, slot_limit: Number(e.target.value) })}
            />
          </Field>
          <Field label="Monthly price (£)">
            <input
              type="number"
              className="w-full rounded border px-2 py-1.5"
              value={draft.monthly_price_pence / 100}
              onChange={(e) => setDraft({ ...draft, monthly_price_pence: Math.round(Number(e.target.value) * 100) })}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={create}
              disabled={saving || !draft.name.trim()}
              className="w-full rounded-lg bg-[color:var(--color-brand-primary,#1B4D3E)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Slots</th>
              <th className="px-4 py-3">£/mo</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3">{PLACEMENT_TYPE_LABELS[p.placement_type]}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.postcode_district ?? p.town ?? p.region_scope ?? "Nationwide"}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={p.slot_limit}
                    className="w-16 rounded border px-2 py-1"
                    onBlur={(e) => patch(p.id, { slot_limit: Number(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={p.monthly_price_pence / 100}
                    className="w-20 rounded border px-2 py-1"
                    onBlur={(e) => patch(p.id, { monthly_price_pence: Math.round(Number(e.target.value) * 100) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={p.status}
                    className="rounded border px-2 py-1 text-xs"
                    onChange={(e) => patch(p.id, { status: e.target.value as PlacementProduct["status"] })}
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="archived">archived</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
