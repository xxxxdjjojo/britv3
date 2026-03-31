"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track-event";

export function ServiceSearchBar() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = () => {
    trackEvent("services_search_submit", { category, location });

    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (location) params.set("location", location);

    const query = params.toString();
    router.push(`/services/tradespeople${query ? `?${query}` : ""}`);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl shadow-brand-primary/20 flex flex-col md:flex-row items-stretch gap-2 max-w-3xl mx-auto">
      <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-neutral-100">
        <Search className="size-5 text-brand-primary/40 shrink-0" />
        <input
          className="w-full border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 py-4 font-medium bg-transparent outline-none"
          placeholder="Service (e.g. Plumber, Electrician)"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Service type"
        />
      </div>
      <div className="flex-1 flex items-center px-4 gap-3">
        <MapPin className="size-5 text-brand-primary/40 shrink-0" />
        <input
          className="w-full border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 py-4 font-medium bg-transparent outline-none"
          placeholder="Location or Postcode"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Location or postcode"
        />
      </div>
      <button
        className="bg-brand-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-brand-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
        onClick={handleSubmit}
        aria-label="Search for professionals"
      >
        Search
      </button>
    </div>
  );
}
