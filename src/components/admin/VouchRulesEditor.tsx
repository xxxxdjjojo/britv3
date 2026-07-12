"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VouchRules } from "@/types/provider-dashboard";

type Props = Readonly<{
  rules: VouchRules;
}>;

type NumberField = {
  key:
    | "required_peer_vouches"
    | "required_client_vouches"
    | "client_recency_days"
    | "invite_expiry_days"
    | "resend_cooldown_hours";
  label: string;
  min: number;
};

const NUMBER_FIELDS: readonly NumberField[] = [
  { key: "required_peer_vouches", label: "Required peer vouches", min: 0 },
  { key: "required_client_vouches", label: "Required client vouches", min: 0 },
  { key: "client_recency_days", label: "Client recency window (days)", min: 1 },
  { key: "invite_expiry_days", label: "Invite expiry (days)", min: 1 },
  { key: "resend_cooldown_hours", label: "Resend cooldown (hours)", min: 0 },
];

export function VouchRulesEditor({ rules }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    required_peer_vouches: rules.required_peer_vouches,
    required_client_vouches: rules.required_client_vouches,
    client_recency_days: rules.client_recency_days,
    invite_expiry_days: rules.invite_expiry_days,
    resend_cooldown_hours: rules.resend_cooldown_hours,
    gate_enabled: rules.gate_enabled,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Parse the current form values against each field's bound. A cleared input
  // yields "" → NaN, which we reject here with a field-specific message rather
  // than letting Number("") === 0 slip through to a generic server 400. Derived
  // so the message surfaces the moment a field goes invalid (the submit button
  // is disabled while invalid, so it can't be the only trigger).
  const invalidField = NUMBER_FIELDS.find((field) => {
    const value = form[field.key];
    return !Number.isInteger(value) || value < field.min;
  });
  const validationError = invalidField
    ? `Enter a valid value for ${invalidField.label}.`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (invalidField) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vouch-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Failed to save rules.");
        setPending(false);
        return;
      }
      setSaved(true);
      setPending(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4"
    >
      <h3 className="text-sm font-semibold text-neutral-900">Vouch rules</h3>
      <p className="mt-0.5 text-xs text-neutral-500">
        Thresholds and windows for the trader vouching flow.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NUMBER_FIELDS.map((field) => (
          <label key={field.key} className="block text-xs font-medium text-neutral-700">
            {field.label}
            <input
              type="number"
              min={field.min}
              value={Number.isNaN(form[field.key]) ? "" : form[field.key]}
              onChange={(e) => {
                const raw = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  // Empty string → NaN so validation flags it, rather than
                  // Number("") === 0 silently coercing a cleared field to 0.
                  [field.key]: raw === "" ? Number.NaN : Number(raw),
                }));
              }}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-neutral-700">
        <input
          type="checkbox"
          checked={form.gate_enabled}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, gate_enabled: e.target.checked }))
          }
          className="mt-0.5"
        />
        <span>
          <span className="font-medium">
            Enforce vouch requirements for verification (default off)
          </span>
          <span className="block text-neutral-500">
            When on, admins are warned before approving a provider whose vouch
            requirements are not met.
          </span>
        </span>
      </label>

      {(validationError ?? error) && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {validationError ?? error}
        </p>
      )}
      {saved && !error && !validationError && (
        <p role="status" className="mt-3 text-xs text-green-600">
          Rules saved.
        </p>
      )}

      <div className="mt-4">
        <button
          type="submit"
          disabled={pending || invalidField !== undefined}
          className="rounded bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save rules"}
        </button>
      </div>
    </form>
  );
}
