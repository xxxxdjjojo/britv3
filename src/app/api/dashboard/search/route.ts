import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SearchResult = {
  type: "property" | "tenant" | "maintenance";
  id: string;
  label: string;
  sublabel: string;
  href: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  // Properties via listings (user's own listings joined to properties)
  try {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, properties(id, address_line1, city, postcode)")
      .eq("user_id", user.id)
      .limit(5);

    for (const l of listings ?? []) {
      const p = l.properties as unknown as {
        id: string;
        address_line1: string;
        city: string;
        postcode: string;
      } | null;
      if (
        p &&
        `${p.address_line1} ${p.city} ${p.postcode}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ) {
        results.push({
          type: "property",
          id: p.id,
          label: `${p.address_line1}, ${p.city}`,
          sublabel: p.postcode,
          href: `/dashboard/landlord/properties/${l.id}/overview`,
        });
      }
    }
  } catch {
    // Silently skip if query fails
  }

  // Tenancies — tenant names (RLS scopes to landlord_id = auth.uid())
  try {
    const { data: tenancies } = await supabase
      .from("tenancies")
      .select("id, tenant_name, tenant_email, property_id")
      .ilike("tenant_name", pattern)
      .limit(5);

    for (const t of tenancies ?? []) {
      results.push({
        type: "tenant",
        id: t.id,
        label: t.tenant_name,
        sublabel: t.tenant_email ?? "",
        href: `/dashboard/landlord/properties/${t.property_id}/tenancies/${t.id}`,
      });
    }
  } catch {
    // Silently skip
  }

  // Maintenance requests (RLS scopes to property owner)
  try {
    const { data: maintenance } = await supabase
      .from("maintenance_requests")
      .select("id, title, property_id")
      .ilike("title", pattern)
      .limit(5);

    for (const m of maintenance ?? []) {
      results.push({
        type: "maintenance",
        id: m.id,
        label: m.title,
        sublabel: "Maintenance request",
        href: `/dashboard/landlord/maintenance/${m.id}`,
      });
    }
  } catch {
    // Silently skip
  }

  return NextResponse.json({ results });
}
