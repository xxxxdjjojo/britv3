"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics/track-event";

type Candidate = { paon: string | null; saon: string | null; street: string | null; label: string };

export function AddressStep({ initialPostcode }: { initialPostcode?: string }) {
  const router = useRouter();
  const [postcode, setPostcode] = useState(initialPostcode ?? "");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [normalisedPostcode, setNormalisedPostcode] = useState("");
  const [outwardCode, setOutwardCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/valuations/session", { method: "POST" });
  }, []);

  async function findAddresses(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCandidates(null);
    setSelected(null);
    setManual(false);
    try {
      const res = await fetch(`/api/valuations/address?postcode=${encodeURIComponent(postcode)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't look up that postcode");
        return;
      }
      setNormalisedPostcode(data.postcode);
      setOutwardCode(data.outwardCode);
      setCandidates(data.candidates as Candidate[]);
      trackEvent("postcode_submitted", { outward_code: data.outwardCode });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function continueToDetails() {
    setError(null);
    setSubmitting(true);
    const chosen =
      manual || selected === null
        ? { paon: null, saon: null, street: null, label: manualAddress.trim() || normalisedPostcode }
        : candidates![selected];
    try {
      const res = await fetch("/api/valuations/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: normalisedPostcode, ...chosen }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Couldn't save that address");
        return;
      }
      trackEvent("address_selected", { manual, outward_code: outwardCode });
      router.push("/value-my-property/details");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue = (selected !== null && !manual) || (manual && manualAddress.trim().length > 3);

  return (
    <div className="space-y-6">
      <form onSubmit={findAddresses} className="space-y-3">
        <Label htmlFor="postcode">Postcode</Label>
        <div className="flex gap-2">
          <Input
            id="postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. SW18 4QN"
            autoComplete="postal-code"
            aria-describedby={error ? "address-error" : undefined}
            className="uppercase"
          />
          <Button type="submit" disabled={loading || postcode.trim().length < 5}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span className="ml-2">Find</span>
          </Button>
        </div>
      </form>

      {error ? (
        <p id="address-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {candidates ? (
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-neutral-700">
              Select your property{candidates.length === 0 ? " (none registered — enter it manually)" : ""}
            </legend>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-1">
              {candidates.map((c, i) => (
                <label
                  key={`${c.label}-${i}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-brand-primary/5 ${
                    selected === i && !manual ? "bg-brand-primary/10 font-medium" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="accent-brand-primary"
                    checked={selected === i && !manual}
                    onChange={() => {
                      setSelected(i);
                      setManual(false);
                    }}
                  />
                  <MapPin className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                  <span>
                    {c.label}, {normalisedPostcode}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="address"
              className="accent-brand-primary"
              checked={manual}
              onChange={() => setManual(true)}
            />
            My address isn&apos;t listed
          </label>
          {manual ? (
            <Input
              aria-label="Your address"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g. Flat 2, 14 South Street"
            />
          ) : null}

          <Button onClick={continueToDetails} disabled={!canContinue || submitting} className="w-full">
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
