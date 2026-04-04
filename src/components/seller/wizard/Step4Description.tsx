"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { WizardShell } from "./WizardShell";
import type { SellerListing, DescriptionTone } from "@/types/seller";
import { cn } from "@/lib/utils";

const TONES: Array<{ key: DescriptionTone; label: string; desc: string }> = [
  { key: "professional", label: "Professional", desc: "Agent-style, precise" },
  { key: "warm", label: "Warm", desc: "Lifestyle, family-friendly" },
  { key: "luxury", label: "Luxury", desc: "Premium, aspirational" },
];

const MAX_CHARS = 2000;

type KeyPoint = { id: string; value: string };

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
  listingId: string;
}>;

export function Step4Description({ listing, listingId }: Props) {
  const router = useRouter();
  const [tone, setTone] = useState<DescriptionTone>(listing?.description_tone ?? "professional");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>(
    listing?.key_selling_points?.length
      ? listing.key_selling_points.map((v) => ({ id: crypto.randomUUID(), value: v }))
      : [{ id: crypto.randomUUID(), value: "" }],
  );
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/seller/describe?listing_id=${listingId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { attempts_used?: number }) => setAttemptsUsed(d.attempts_used ?? 0))
      .catch(() => {});
    return () => controller.abort();
  }, [listingId]);

  const generateDescription = async () => {
    if (attemptsUsed >= 3) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/seller/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, tone }),
      });
      const data = await res.json() as { description?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDescription(data.description ?? "");
      setAttemptsUsed((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const addKeyPoint = () => setKeyPoints((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  const updateKeyPoint = (id: string, v: string) =>
    setKeyPoints((prev) => prev.map((p) => (p.id === id ? { ...p, value: v } : p)));
  const removeKeyPoint = (id: string) =>
    setKeyPoints((prev) => prev.filter((p) => p.id !== id));

  const handleContinue = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          description_tone: tone,
          key_selling_points: keyPoints.map((p) => p.value).filter((k) => k.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/dashboard/seller/listings/create?step=5&id=${listingId}`);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const attemptsRemaining = 3 - attemptsUsed;

  return (
    <WizardShell step={4} listingId={listingId} onContinue={() => void handleContinue()} isLoading={saving}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">AI Description</h2>
            <p className="text-neutral-500 text-sm mt-1">Let AI write your listing description, or write your own</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-600">Tone</label>
            <div className="flex gap-3">
              {TONES.map(({ key, label, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTone(key)}
                  className={cn(
                    "flex-1 py-3 px-3 rounded-xl border-2 text-left transition-all duration-150",
                    tone === key
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                  )}
                >
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-neutral-600">Description</label>
            <div className="flex items-center gap-3">
              {attemptsRemaining > 0 && (
                <span className="text-xs text-neutral-400">
                  {attemptsRemaining} generation{attemptsRemaining !== 1 ? "s" : ""} left
                </span>
              )}
              <button
                type="button"
                onClick={() => void generateDescription()}
                disabled={generating || attemptsUsed >= 3}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold transition-colors",
                  attemptsUsed >= 3
                    ? "text-neutral-300 cursor-not-allowed"
                    : "text-brand-primary hover:text-brand-primary-light",
                )}
              >
                <Sparkles size={16} />
                {generating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
              rows={10}
              placeholder="Write your property description here, or use AI to generate one above..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              style={{ minHeight: 300 }}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {description.length > 50 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success-light text-success">
                  Good length
                </span>
              )}
              <span className="text-xs text-neutral-400">
                {description.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-600">Key Selling Points</label>
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2">
              {keyPoints.map((point, i) => (
                <div key={point.id} className="flex gap-2">
                  <input
                    type="text"
                    value={point.value}
                    onChange={(e) => updateKeyPoint(point.id, e.target.value)}
                    placeholder={`e.g. ${["South-facing garden", "Walking distance to tube", "Recently refurbished kitchen"][i % 3]}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  {keyPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyPoint(point.id)}
                      className="p-2 text-neutral-400 hover:text-error"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addKeyPoint}
                className="text-sm text-brand-primary font-semibold hover:underline"
              >
                + Add another point
              </button>
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}
        </div>

        {/* Preview sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-8 bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <p className="text-sm font-bold text-neutral-600">Live Preview</p>
            {listing?.photos?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.photos[0].url}
                alt="Preview"
                className="w-full rounded-xl aspect-video object-cover"
              />
            ) : (
              <div className="w-full rounded-xl aspect-video bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">
                No photo yet
              </div>
            )}
            <div>
              <p className="text-xs text-neutral-400">{listing?.postcode}</p>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">
                {listing?.address_line_1 ?? "Your property address"}
              </p>
              {description ? (
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed line-clamp-6">{description}</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {[100, 80, 90, 60].map((w, i) => (
                    <div key={i} className="h-2.5 bg-neutral-100 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-neutral-100 pt-4">
              <p className="text-xs font-semibold text-neutral-500">Expert Tip</p>
              <p className="text-xs text-neutral-400 mt-1">
                Listings with 10+ photos receive 40% more enquiries. Add your best photo as the cover image.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
