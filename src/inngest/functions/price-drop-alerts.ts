/**
 * Inngest cron: Price Drop Alerts (daily at 6am UTC)
 *
 * Flow:
 *   1. Query price_history for properties where latest price < previous price
 *   2. For each price drop, find users with matching saved_properties
 *   3. Create in-app notification
 *   4. Send email via sendPropertyAlert()
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPropertyAlert } from "@/services/email/email-service";

type PriceDrop = {
  property_id: string;
  listing_id: string;
  title: string;
  slug: string | null;
  old_price: number;
  new_price: number;
  drop_pct: number;
};

export const priceDropAlerts = inngest.createFunction(
  {
    id: "price-drop-alerts",
    name: "Daily price drop alert notifications",
  },
  { cron: "0 6 * * *" },
  async ({ step }) => {
    const supabase = createAdminClient();

    const drops = await step.run("find-price-drops", async () => {
      const { data, error } = await supabase.rpc("find_recent_price_drops");

      if (error) {
        console.error("[price-drop-alerts] Failed to query price drops:", error);
        return [] as PriceDrop[];
      }

      return (data ?? []) as PriceDrop[];
    });

    if (drops.length === 0) {
      return { status: "no_drops", notificationsSent: 0 };
    }

    const BATCH_SIZE = 50;
    let totalNotifications = 0;

    for (let i = 0; i < drops.length; i += BATCH_SIZE) {
      const batch = drops.slice(i, i + BATCH_SIZE);

      const batchResult = await step.run(
        `process-batch-${Math.floor(i / BATCH_SIZE)}`,
        async () => {
          let batchNotifications = 0;

          // 1. Batch query: saved_properties for all property_ids in this batch
          const propertyIds = batch.map((d) => d.property_id);
          const { data: allSavedProps } = await supabase
            .from("saved_properties")
            .select("property_id, user_id")
            .in("property_id", propertyIds);

          // Build Map<property_id, user_id[]>
          const savedPropsMap = new Map<string, string[]>();
          for (const sp of (allSavedProps ?? []) as { property_id: string; user_id: string }[]) {
            const existing = savedPropsMap.get(sp.property_id);
            if (existing) {
              if (!existing.includes(sp.user_id)) existing.push(sp.user_id);
            } else {
              savedPropsMap.set(sp.property_id, [sp.user_id]);
            }
          }

          // 2. Batch query: search_listings for all listing_ids
          const listingIds = batch.map((d) => d.listing_id);
          const { data: allListings } = await supabase
            .from("search_listings")
            .select("listing_id, city, listing_type, bedrooms, price")
            .in("listing_id", listingIds);

          // Build Map<listing_id, listing>
          const listingsMap = new Map<string, { bedrooms?: number }>();
          for (const l of (allListings ?? []) as { listing_id: string; bedrooms?: number }[]) {
            listingsMap.set(l.listing_id, l);
          }

          // 3. Collect all unique user_ids, batch query profiles
          const allUserIds = new Set<string>();
          for (const drop of batch) {
            const userIds = savedPropsMap.get(drop.property_id) ?? [];
            for (const uid of userIds) allUserIds.add(uid);
          }

          const profilesMap = new Map<string, { email: string; first_name: string }>();
          if (allUserIds.size > 0) {
            const { data: allProfiles } = await supabase
              .from("profiles")
              .select("id, email, first_name")
              .in("id", [...allUserIds]);

            for (const p of (allProfiles ?? []) as { id: string; email: string; first_name: string }[]) {
              profilesMap.set(p.id, { email: p.email, first_name: p.first_name });
            }
          }

          // 4. Build all notifications for a single batch insert
          const notifications: {
            user_id: string;
            type: string;
            title: string;
            body: string;
            link: string;
            read: boolean;
          }[] = [];

          // Track per-user drop info for email sends
          const emailTasks: {
            userId: string;
            profile: { email: string; first_name: string };
            drop: PriceDrop;
            listing: { bedrooms?: number } | undefined;
          }[] = [];

          for (const drop of batch) {
            const userIds = savedPropsMap.get(drop.property_id) ?? [];
            const listing = listingsMap.get(drop.listing_id);

            for (const userId of userIds) {
              const profile = profilesMap.get(userId);
              if (!profile) continue;

              notifications.push({
                user_id: userId,
                type: "price_drop",
                title: "Price reduced!",
                body: `${drop.title} dropped ${drop.drop_pct.toFixed(0)}% to £${(drop.new_price / 100).toLocaleString("en-GB")}`,
                link: drop.slug ? `/properties/${drop.slug}` : `/properties/listing/${drop.listing_id}`,
                read: false,
              });

              emailTasks.push({ userId, profile, drop, listing });
            }
          }

          // 5. Batch insert all notifications at once
          if (notifications.length > 0) {
            const { error: insertError } = await supabase
              .from("notifications")
              .insert(notifications);

            if (insertError) {
              console.error("[price-drop-alerts] Batch notification insert failed:", insertError);
            }
          }

          // 6. Send emails individually (can't batch external API calls)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

          for (const task of emailTasks) {
            try {
              const listingUrl = task.drop.slug
                ? `${appUrl}/properties/${task.drop.slug}`
                : `${appUrl}/properties/listing/${task.drop.listing_id}`;

              await sendPropertyAlert({
                userId: task.userId,
                email: task.profile.email,
                firstName: task.profile.first_name || "there",
                searchName: "Price Drop Alert",
                matchingProperties: [{
                  id: task.drop.listing_id,
                  address: task.drop.title,
                  price: task.drop.new_price / 100,
                  bedrooms: task.listing?.bedrooms ?? 0,
                  listingUrl,
                }],
                manageAlertsUrl: `${appUrl}/dashboard/settings/notifications`,
              });

              batchNotifications++;
            } catch (err) {
              console.error(`[price-drop-alerts] Failed to notify user ${task.userId}:`, err);
            }
          }

          return batchNotifications;
        },
      );

      totalNotifications += batchResult;
    }

    return {
      status: "completed",
      dropsFound: drops.length,
      notificationsSent: totalNotifications,
    };
  },
);
