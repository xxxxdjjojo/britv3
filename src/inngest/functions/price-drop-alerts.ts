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
import { captureException } from "@/lib/observability/capture-exception";

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
        captureException(error, {
          module: "property",
          feature: "price-drop-alerts",
          operation: "queryPriceDrops",
        });
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

          for (const drop of batch) {
            const { data: savedProps } = await supabase
              .from("saved_properties")
              .select("user_id")
              .eq("property_id", drop.property_id);

            const { data: listing } = await supabase
              .from("search_listings")
              .select("city, listing_type, bedrooms, price")
              .eq("listing_id", drop.listing_id)
              .maybeSingle();

            const matchedUserIds = new Set<string>();

            for (const sp of savedProps ?? []) {
              matchedUserIds.add((sp as { user_id: string }).user_id);
            }

            for (const userId of matchedUserIds) {
              try {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("email, first_name")
                  .eq("id", userId)
                  .maybeSingle();

                if (!profile) continue;
                const p = profile as { email: string; first_name: string };

                const { error: tableCheck } = await supabase
                  .from("notifications")
                  .select("id")
                  .limit(0);

                if (!tableCheck) {
                  await supabase.from("notifications").insert({
                    user_id: userId,
                    type: "price_drop",
                    title: "Price reduced!",
                    body: `${drop.title} dropped ${drop.drop_pct.toFixed(0)}% to £${(drop.new_price / 100).toLocaleString("en-GB")}`,
                    link: drop.slug ? `/properties/${drop.slug}` : `/properties/listing/${drop.listing_id}`,
                    read: false,
                  });
                }

                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
                const listingUrl = drop.slug
                  ? `${appUrl}/properties/${drop.slug}`
                  : `${appUrl}/properties/listing/${drop.listing_id}`;
                await sendPropertyAlert({
                  userId,
                  email: p.email,
                  firstName: p.first_name || "there",
                  searchName: "Price Drop Alert",
                  matchingProperties: [{
                    id: drop.listing_id,
                    address: drop.title,
                    price: drop.new_price / 100,
                    bedrooms: (listing as { bedrooms?: number } | null)?.bedrooms ?? 0,
                    listingUrl,
                  }],
                  manageAlertsUrl: `${appUrl}/dashboard/settings/notifications`,
                });

                batchNotifications++;
              } catch (err) {
                captureException(err, {
                  module: "property",
                  feature: "price-drop-alerts",
                  operation: "notifyUser",
                  extra: { userId, propertyId: drop.property_id },
                });
              }
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
