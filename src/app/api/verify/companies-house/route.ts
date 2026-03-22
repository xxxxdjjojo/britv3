import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCompaniesHouseNumber, normalizeCompaniesHouseNumber } from "@/lib/validators/uk";

const CH_API_BASE = "https://api.company-information.service.gov.uk";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { company_number } = await request.json();

    if (!company_number || !validateCompaniesHouseNumber(company_number)) {
      return NextResponse.json(
        { error: "Invalid company number. Must be 8 alphanumeric characters." },
        { status: 400 },
      );
    }

    const normalized = normalizeCompaniesHouseNumber(company_number);
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

    if (!apiKey) {
      console.error("[CH API] COMPANIES_HOUSE_API_KEY not configured");
      return NextResponse.json(
        { error: "Company verification is not yet available." },
        { status: 503 },
      );
    }

    const authHeader = "Basic " + Buffer.from(apiKey + ":").toString("base64");

    const companyRes = await fetch(
      `${CH_API_BASE}/company/${normalized}`,
      {
        headers: { Authorization: authHeader },
        next: { revalidate: 86400 },
      },
    );

    if (!companyRes.ok) {
      if (companyRes.status === 404) {
        return NextResponse.json(
          { error: `Company number ${normalized} not found at Companies House.` },
          { status: 404 },
        );
      }
      if (companyRes.status === 429) {
        return NextResponse.json(
          { error: "Too many verification requests. Please wait a moment and try again." },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: "Companies House service is temporarily unavailable." },
        { status: 503 },
      );
    }

    const company = await companyRes.json();

    if (company.company_status !== "active") {
      return NextResponse.json(
        {
          error: `This company is listed as "${company.company_status}". Only active companies can be verified.`,
          company_name: company.company_name,
          company_status: company.company_status,
        },
        { status: 422 },
      );
    }

    let directors: Array<{ name: string; role: string }> = [];
    try {
      const officersRes = await fetch(
        `${CH_API_BASE}/company/${normalized}/officers`,
        { headers: { Authorization: authHeader } },
      );
      if (officersRes.ok) {
        const officersData = await officersRes.json();
        directors = (officersData.items || [])
          .filter((o: { officer_role: string; resigned_on?: string }) =>
            o.officer_role === "director" && !o.resigned_on
          )
          .map((o: { name: string; officer_role: string }) => ({
            name: o.name,
            role: o.officer_role,
          }));
      }
    } catch {
      console.warn("[CH API] Failed to fetch officers for", normalized);
    }

    const address = company.registered_office_address || {};

    return NextResponse.json({
      company_number: normalized,
      company_name: company.company_name,
      company_status: company.company_status,
      sic_codes: company.sic_codes || [],
      registered_address: {
        line1: address.address_line_1 || "",
        line2: address.address_line_2 || "",
        city: address.locality || "",
        county: address.region || "",
        postcode: address.postal_code || "",
        country: address.country || "United Kingdom",
      },
      directors,
    });
  } catch (err) {
    console.error("[CH API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to verify company. Please try again." },
      { status: 500 },
    );
  }
}
