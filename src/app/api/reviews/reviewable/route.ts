import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReviewableItem = {
  type: "booking" | "tenancy" | "agent_transaction";
  source_id: string;
  provider_name: string;
  description: string;
  date: string;
};

/**
 * GET /api/reviews/reviewable
 * Returns all interactions the current user can review that haven't been reviewed yet.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const reviewable: ReviewableItem[] = [];

    // 1. Completed bookings not yet reviewed
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_start_date,
        actual_end_date,
        provider_id,
        service_provider_details!inner (business_name)
      `)
      .eq("user_id", user.id)
      .eq("status", "completed");

    // Filter out bookings already reviewed (client-side dedup)
    if (bookings && bookings.length > 0) {
      const { data: existingBookingReviews } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("reviewer_id", user.id)
        .not("booking_id", "is", null)
        .is("deleted_at", null);

      const reviewedBookingIds = new Set(
        (existingBookingReviews ?? []).map((r) => r.booking_id),
      );

      for (const booking of bookings) {
        if (reviewedBookingIds.has(booking.id)) continue;
        const providerDetails = booking.service_provider_details as unknown as { business_name: string } | null;
        const dateStr = new Date(booking.actual_end_date ?? booking.scheduled_start_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        reviewable.push({
          type: "booking",
          source_id: booking.id,
          provider_name: providerDetails?.business_name ?? "Service provider",
          description: `Job completed on ${dateStr}`,
          date: booking.actual_end_date ?? booking.scheduled_start_date,
        });
      }
    }

    // 2. Tenancies where user is tenant or landlord (active, ended, ending_soon)
    const { data: tenancies } = await supabase
      .from("tenancies")
      .select("id, landlord_id, tenant_user_id, tenant_name, lease_start_date, status")
      .or(`tenant_user_id.eq.${user.id},landlord_id.eq.${user.id}`)
      .in("status", ["active", "ended", "ending_soon"]);

    if (tenancies && tenancies.length > 0) {
      const { data: existingTenancyReviews } = await supabase
        .from("reviews")
        .select("verification_source_id")
        .eq("reviewer_id", user.id)
        .eq("verification_type", "tenancy")
        .is("deleted_at", null);

      const reviewedTenancyIds = new Set(
        (existingTenancyReviews ?? []).map((r) => r.verification_source_id),
      );

      // Fetch landlord names for tenant reviewers
      const landlordIds = tenancies
        .filter((t) => t.tenant_user_id === user.id)
        .map((t) => t.landlord_id);

      let landlordNameMap: Record<string, string> = {};
      if (landlordIds.length > 0) {
        const { data: landlordProfiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", landlordIds);

        landlordNameMap = Object.fromEntries(
          (landlordProfiles ?? []).map((p) => [p.id, p.display_name ?? "Landlord"]),
        );
      }

      for (const tenancy of tenancies) {
        if (reviewedTenancyIds.has(tenancy.id)) continue;

        const isTenant = tenancy.tenant_user_id === user.id;
        const providerName = isTenant
          ? landlordNameMap[tenancy.landlord_id] ?? "Landlord"
          : tenancy.tenant_name ?? "Tenant";

        const dateStr = new Date(tenancy.lease_start_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        reviewable.push({
          type: "tenancy",
          source_id: tenancy.id,
          provider_name: providerName,
          description: `Tenancy started ${dateStr} (${tenancy.status})`,
          date: tenancy.lease_start_date,
        });
      }
    }

    // 3. Agent sale progressions linked to user's offers
    // Since agent_offers lacks buyer_user_id, we look up via agent_crm_clients
    const { data: crmClients } = await supabase
      .from("agent_crm_clients")
      .select("agent_id")
      .eq("user_id", user.id);

    if (crmClients && crmClients.length > 0) {
      const agentIds = crmClients.map((c) => c.agent_id);

      const { data: progressions } = await supabase
        .from("agent_sale_progressions")
        .select(`
          id,
          agent_id,
          stage,
          created_at,
          agent_offers!inner (buyer_name, agent_id)
        `)
        .in("agent_id", agentIds);

      if (progressions && progressions.length > 0) {
        const { data: existingAgentReviews } = await supabase
          .from("reviews")
          .select("verification_source_id")
          .eq("reviewer_id", user.id)
          .eq("verification_type", "agent_transaction")
          .is("deleted_at", null);

        const reviewedProgressionIds = new Set(
          (existingAgentReviews ?? []).map((r) => r.verification_source_id),
        );

        // Fetch agent profile names
        const { data: agentProfiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", agentIds);

        const agentNameMap = Object.fromEntries(
          (agentProfiles ?? []).map((p) => [p.id, p.display_name ?? "Estate agent"]),
        );

        for (const progression of progressions) {
          if (reviewedProgressionIds.has(progression.id)) continue;

          const dateStr = new Date(progression.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          reviewable.push({
            type: "agent_transaction",
            source_id: progression.id,
            provider_name: agentNameMap[progression.agent_id] ?? "Estate agent",
            description: `Sale progression (${progression.stage.replace(/_/g, " ")}) from ${dateStr}`,
            date: progression.created_at,
          });
        }
      }
    }

    return NextResponse.json({ reviewable });
  } catch (error) {
    console.error("GET /api/reviews/reviewable error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviewable interactions" },
      { status: 500 },
    );
  }
}
