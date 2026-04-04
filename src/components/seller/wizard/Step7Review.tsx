"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { WizardShell } from "./WizardShell";
import type { SellerListing, ListingStep } from "@/types/seller";
import { cn } from "@/lib/utils";

type ChecklistItem = Readonly<{
  label: string;
  complete: boolean;
  required: boolean;
  editStep: ListingStep;
}>;

function buildChecklist(listing: Partial<SellerListing>): ChecklistItem[] {
  return [
    { label: "Property address", complete: !!listing.address_line_1, required: true, editStep: 1 as ListingStep },
    { label: "Property type & tenure", complete: !!(listing.property_type && listing.tenure), required: true, editStep: 1 as ListingStep },
    { label: "Property details (beds/baths)", complete: !!(listing.bedrooms !== undefined && listing.bedrooms !== null && listing.bathrooms !== undefined && listing.bathrooms !== null), required: true, editStep: 2 as ListingStep },
    { label: "Photos added", complete: (listing.photos?.length ?? 0) >= 1, required: true, editStep: 3 as ListingStep },
    { label: "Property description", complete: (listing.description?.length ?? 0) >= 50, required: true, editStep: 4 as ListingStep },
    { label: "Asking price set", complete: !!(listing.asking_price && listing.asking_price > 0), required: true, editStep: 5 as ListingStep },
    { label: "EPC certificate uploaded", complete: !!listing.epc_url, required: true, editStep: 6 as ListingStep },
    { label: "Key selling points added", complete: (listing.key_selling_points?.length ?? 0) >= 1, required: false, editStep: 4 as ListingStep },
  ];
}

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
  listingId: string;
}>;

export function Step7Review({ listing, listingId }: Props) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [cputrAccepted, setCputrAccepted] = useState(false);
  const [error, setError] = useState("");

  if (!listing) {
    return <div className="text-center py-16 text-neutral-400">Loading listing...</div>;
  }

  const checklist = buildChecklist(listing);
  const requiredComplete = checklist.filter((c) => c.required).every((c) => c.complete);
  const totalComplete = checklist.filter((c) => c.complete).length;

  const handlePublish = async () => {
    if (!requiredComplete) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      router.push("/dashboard/seller/listings?published=1");
    } catch {
      setError("Failed to publish. Please check all required fields are complete.");
    } finally {
      setPublishing(false);
    }
  };

  const price = listing.asking_price
    ? `£${(listing.asking_price / 100).toLocaleString("en-GB")}`
    : "Price not set";

  const thumb = listing.photos?.[0]?.url;

  return (
    <WizardShell
      step={7}
      listingId={listingId}
      onContinue={handlePublish}
      continueLabel={publishing ? "Publishing..." : "Publish Listing"}
      continueDisabled={!requiredComplete || !cputrAccepted}
      isLoading={publishing}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">Review & Publish</h2>
          <p className="text-neutral-500 text-sm mt-1">Check everything looks good before going live</p>
        </div>

        {/* Listing preview card */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          {thumb ? (
            <div className="relative w-full h-56">
              <Image src={thumb} alt="Listing cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 700px" />
            </div>
          ) : (
            <div className="w-full h-56 bg-neutral-100 flex items-center justify-center text-neutral-300 text-sm">No cover photo</div>
          )}
          <div className="p-6">
            <p className="text-xs text-neutral-400">{listing.postcode}</p>
            <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
              {listing.address_line_1}{listing.address_line_2 ? `, ${listing.address_line_2}` : ""}, {listing.city}
            </h3>
            <p className="text-2xl font-black text-neutral-900 mt-2">{price}</p>
            {listing.bedrooms !== null && listing.bedrooms !== undefined && (
              <p className="text-sm text-neutral-500 mt-1">
                {listing.bedrooms} bed · {listing.bathrooms ?? "–"} bath · {listing.property_type}
              </p>
            )}
            {listing.description && (
              <p className="text-sm text-neutral-600 mt-3 line-clamp-3">{listing.description}</p>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Publication Checklist</h3>
            <span className="text-sm font-semibold text-neutral-500">
              {totalComplete}/{checklist.length} complete
            </span>
          </div>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li
                key={item.label}
                onClick={() => {
                  if (!item.complete) {
                    router.push(`/dashboard/seller/listings/create?step=${item.editStep}&id=${listingId}`);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2",
                  !item.complete && "cursor-pointer hover:bg-neutral-50 transition-colors",
                )}
              >
                {item.complete ? (
                  <CheckCircle size={18} className="text-success flex-shrink-0" />
                ) : item.required ? (
                  <XCircle size={18} className="text-error flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-warning flex-shrink-0" />
                )}
                <span className={cn(
                  "text-sm",
                  item.complete ? "text-neutral-600" : item.required ? "text-error font-medium" : "text-neutral-400",
                )}>
                  {item.label}
                  {!item.required && !item.complete && " (optional)"}
                </span>
              </li>
            ))}
          </ul>

          {!requiredComplete && (
            <div className="mt-4 bg-error-light rounded-xl p-4 border border-error/20">
              <p className="text-xs font-semibold text-error">
                Complete all required fields before publishing.
              </p>
            </div>
          )}
        </div>

        {/* CPUTR Declaration */}
        <div className="bg-warning-light rounded-2xl border border-warning/30 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={cputrAccepted}
              onCheckedChange={(v) => setCputrAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-neutral-600 leading-relaxed">
              I confirm that all material information about this property has been disclosed in
              accordance with the Consumer Protection from Unfair Trading Regulations 2008 and
              National Trading Standards guidance. I understand that withholding material
              information may constitute a criminal offence.
            </span>
          </label>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}
      </div>
    </WizardShell>
  );
}
