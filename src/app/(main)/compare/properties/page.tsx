"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { GitCompareArrows, ArrowRight, Home, Bed, Bath, Maximize, Zap, PoundSterling } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  epc_rating: string | null;
  council_tax_band: string | null;
  property_type: string | null;
  tenure: string | null;
  images: string[] | null;
  address_line_1: string | null;
  city: string | null;
  postcode: string | null;
};

const MAX_COMPARE = 4;

const COMPARE_FIELDS: Array<{
  key: keyof PropertyRow;
  label: string;
  icon: React.ReactNode;
  format?: (v: unknown) => string;
}> = [
  {
    key: "price",
    label: "Price",
    icon: <PoundSterling className="w-4 h-4" />,
    format: (v) =>
      v != null
        ? `£${Number(v).toLocaleString("en-GB")}`
        : "—",
  },
  {
    key: "bedrooms",
    label: "Bedrooms",
    icon: <Bed className="w-4 h-4" />,
    format: (v) => (v != null ? String(v) : "—"),
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    icon: <Bath className="w-4 h-4" />,
    format: (v) => (v != null ? String(v) : "—"),
  },
  {
    key: "square_feet",
    label: "Size (sqft)",
    icon: <Maximize className="w-4 h-4" />,
    format: (v) =>
      v != null
        ? `${Number(v).toLocaleString("en-GB")} sqft`
        : "—",
  },
  {
    key: "epc_rating",
    label: "EPC Rating",
    icon: <Zap className="w-4 h-4" />,
    format: (v) => (v ? String(v).toUpperCase() : "—"),
  },
  {
    key: "council_tax_band",
    label: "Council Tax Band",
    icon: <PoundSterling className="w-4 h-4" />,
    format: (v) => (v ? `Band ${String(v).toUpperCase()}` : "—"),
  },
  {
    key: "property_type",
    label: "Property Type",
    icon: <Home className="w-4 h-4" />,
    format: (v) =>
      v
        ? String(v)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "—",
  },
  {
    key: "tenure",
    label: "Tenure",
    icon: <Home className="w-4 h-4" />,
    format: (v) =>
      v
        ? String(v)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "—",
  },
];

export default function ComparePropertiesPage() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("properties")
      .select(
        "id, slug, title, price, bedrooms, bathrooms, square_feet, epc_rating, council_tax_band, property_type, tenure, images, address_line_1, city, postcode",
      )
      .in("slug", ids)
      .limit(MAX_COMPARE)
      .then(({ data }) => {
        setProperties((data as unknown as PropertyRow[]) ?? []);
        setLoading(false);
      });
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f8]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e3e2e1]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-brand-secondary uppercase tracking-widest mb-2">
                Compare
              </p>
              <h1 className="font-heading font-bold text-[#1a1c1c] text-3xl sm:text-4xl mb-3">
                Compare Properties
              </h1>
              <p className="text-[#404945] max-w-2xl text-base leading-relaxed">
                Compare your shortlisted properties side-by-side to find the
                perfect home.
              </p>
            </div>
            {ids.length > 0 && (
              <a
                href="/search"
                className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors shrink-0"
              >
                Browse More
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {ids.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-primary/10 mb-6">
              <GitCompareArrows className="w-10 h-10 text-brand-primary" />
            </div>
            <h2 className="font-heading font-bold text-[#1a1c1c] text-2xl mb-3">
              No properties to compare yet
            </h2>
            <p className="text-[#404945] mb-8 max-w-md mx-auto leading-relaxed">
              Browse property listings and click &ldquo;Compare&rdquo; to add up
              to {MAX_COMPARE} properties side-by-side.
            </p>
            <a
              href="/search"
              className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
            >
              Search Properties
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-primary/10 mb-6">
              <Home className="w-10 h-10 text-brand-primary" />
            </div>
            <h2 className="font-heading font-bold text-[#1a1c1c] text-2xl mb-3">
              Properties not found
            </h2>
            <p className="text-[#404945] mb-8 max-w-md mx-auto leading-relaxed">
              The properties you selected could not be found. They may have been
              removed or are no longer available.
            </p>
            <a
              href="/search"
              className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
            >
              Search Properties
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              {/* Property images + titles */}
              <thead>
                <tr>
                  <th className="text-left py-4 pr-4 w-40" />
                  {properties.map((p) => {
                    const imgSrc =
                      p.images && p.images.length > 0 ? p.images[0] : null;
                    return (
                      <th
                        key={p.id}
                        className="text-left py-4 px-3 align-top"
                        style={{ minWidth: 200 }}
                      >
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                          <div className="h-40 bg-[#f4f3f2] flex items-center justify-center overflow-hidden">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={p.title}
                                width={320}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Home className="w-10 h-10 text-brand-primary/20" />
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-heading font-semibold text-[#1a1c1c] text-sm leading-snug line-clamp-2">
                              {p.title}
                            </h3>
                            <p className="text-xs text-[#404945] mt-1">
                              {[p.address_line_1, p.city, p.postcode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Comparison rows */}
              <tbody>
                {COMPARE_FIELDS.map((field, idx) => (
                  <tr
                    key={field.key}
                    className={
                      idx % 2 === 0 ? "bg-white" : "bg-[#faf9f8]"
                    }
                  >
                    <td className="py-4 pr-4 pl-2">
                      <div className="flex items-center gap-2 text-[#404945]">
                        <span className="text-brand-primary/60">
                          {field.icon}
                        </span>
                        <span className="text-sm font-medium">
                          {field.label}
                        </span>
                      </div>
                    </td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="py-4 px-3 text-sm font-semibold text-[#1a1c1c]"
                      >
                        {field.format
                          ? field.format(p[field.key])
                          : String(p[field.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* View property links */}
              <tfoot>
                <tr>
                  <td className="py-6" />
                  {properties.map((p) => (
                    <td key={p.id} className="py-6 px-3">
                      <a
                        href={`/properties/${p.slug}`}
                        className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors w-full justify-center"
                      >
                        View Property
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
