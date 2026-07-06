/* eslint-disable no-console -- fire-and-forget email dispatch logs failures */
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/config/brand";
import {
  sendViewingConfirmation,
  sendViewingBookedHostEmail,
  sendViewingRequestHostEmail,
} from "@/services/email/email-service";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Viewing email dispatch — fire-and-forget from the booking/request routes.
// Cross-user reads (the other party's email) require the service-role client,
// so all lookups go through the admin client (RLS-independent, reliable).
// ---------------------------------------------------------------------------

async function resolveListingContext(
  admin: SupabaseClient,
  listingId: string,
): Promise<{ hostId: string; propertyAddress: string } | null> {
  const { data: listing } = await admin
    .from("listings")
    .select("property_id, user_id")
    .eq("id", listingId)
    .single();

  if (!listing?.user_id || !listing.property_id) return null;

  const { data: property } = await admin
    .from("properties")
    .select("address_line1, city, postcode")
    .eq("id", listing.property_id)
    .single();

  const parts = [property?.address_line1, property?.city, property?.postcode].filter(Boolean);
  const propertyAddress = parts.length > 0 ? parts.join(", ") : "your property";

  return { hostId: listing.user_id as string, propertyAddress };
}

async function resolveUser(
  admin: SupabaseClient,
  userId: string,
): Promise<{ email: string | null; name: string }> {
  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  return {
    email: authData?.user?.email ?? null,
    name: (profile?.display_name as string) ?? "there",
  };
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * After a slot is booked: confirm to the booker, notify the host. Never throws.
 */
export async function sendViewingBookedEmails(params: {
  viewingId: string;
  slotId: string;
  listingId: string;
  bookerId: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    const ctx = await resolveListingContext(admin, params.listingId);
    if (!ctx) return;

    const { data: slot } = await admin
      .from("viewing_slots")
      .select("start_time")
      .eq("id", params.slotId)
      .single();
    if (!slot?.start_time) return;

    const { date, time } = formatDateTime(slot.start_time as string);
    const booker = await resolveUser(admin, params.bookerId);
    const dashboardUrl = appUrl("/dashboard");

    if (booker.email) {
      await sendViewingConfirmation({
        userId: params.bookerId,
        email: booker.email,
        firstName: booker.name,
        propertyAddress: ctx.propertyAddress,
        viewingDate: slot.start_time as string,
        viewingTime: time,
        agentName: "the host",
        propertyUrl: dashboardUrl,
      });
    }

    if (ctx.hostId !== params.bookerId) {
      const host = await resolveUser(admin, ctx.hostId);
      if (host.email) {
        await sendViewingBookedHostEmail({
          userId: ctx.hostId,
          email: host.email,
          hostName: host.name,
          propertyAddress: ctx.propertyAddress,
          viewingDate: date,
          viewingTime: time,
          bookerName: booker.name,
          dashboardUrl,
        });
      }
    }
  } catch (err) {
    console.error("[viewing-notifications] sendViewingBookedEmails failed", err);
  }
}

/**
 * After a slot-less viewing request: notify the host. Never throws.
 */
export async function sendViewingRequestEmails(params: {
  viewingId: string;
  listingId: string;
  requesterId: string;
  preferredTime: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    const ctx = await resolveListingContext(admin, params.listingId);
    if (!ctx) return;
    if (ctx.hostId === params.requesterId) return;

    const host = await resolveUser(admin, ctx.hostId);
    if (!host.email) return;

    const { date, time } = formatDateTime(params.preferredTime);
    await sendViewingRequestHostEmail({
      userId: ctx.hostId,
      email: host.email,
      hostName: host.name,
      propertyAddress: ctx.propertyAddress,
      preferredTime: `${date} at ${time}`,
      dashboardUrl: appUrl("/dashboard"),
    });
  } catch (err) {
    console.error("[viewing-notifications] sendViewingRequestEmails failed", err);
  }
}
