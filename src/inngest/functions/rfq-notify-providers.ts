/**
 * Inngest function: Notify matched providers when an RFQ is created.
 *
 * Flow:
 * 1. Find matching providers by category/location/rating
 * 2. Create in-app notifications
 * 3. Wait 1 hour
 * 4. Email fallback for unread notifications
 */

import { inngest } from "@/inngest/client";
import { matchProvidersForRfq } from "@/services/marketplace/rfq-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendProviderRfqEmail } from "@/services/notifications/email-service";

export const rfqNotifyProviders = inngest.createFunction(
  {
    id: "rfq-notify-providers",
    name: "Notify providers about new RFQ",
  },
  { event: "marketplace/rfq.created" },
  async ({ event, step }) => {
    const { rfqId } = event.data as { rfqId: string };
    const supabase = createAdminClient();

    // Step 1: Get matching providers
    const providers = await step.run("get-matching-providers", async () => {
      return matchProvidersForRfq(supabase, rfqId);
    });

    if (providers.length === 0) {
      return { status: "no_matching_providers", rfqId };
    }

    // Step 2: Create in-app notifications for each matched provider
    const notificationIds = await step.run(
      "send-in-app-notifications",
      async () => {
        const ids: string[] = [];

        // Get RFQ details for notification content
        const { data: rfq } = await supabase
          .from("service_requests")
          .select("title, service_category, target_provider_id")
          .eq("id", rfqId)
          .single();

        if (!rfq) {
          console.warn(`RFQ ${rfqId} not found when creating notifications`);
          return ids;
        }

        const isDirect = Boolean(rfq.target_provider_id);

        // Check if notifications table exists (from Phase 3)
        const { error: tableCheck } = await supabase
          .from("notifications")
          .select("id")
          .limit(0);

        if (tableCheck) {
          console.warn(
            "Notifications table not available yet (Phase 3); skipping in-app notifications",
          );
          return ids;
        }

        for (const provider of providers) {
          const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
              user_id: provider.user_id,
              type: "rfq_match",
              title: isDirect
                ? "You've received a direct quote request"
                : "New quote request matches your services",
              body: isDirect
                ? `A customer chose you specifically for "${rfq.title}" -- respond with a quote to win the job.`
                : `"${rfq.title}" in ${rfq.service_category} -- submit a quote to win this job.`,
              link: `/dashboard/provider/jobs/leads`,
              read: false,
            })
            .select("id")
            .single();

          if (!error && notification) {
            ids.push(notification.id as string);
          }
        }

        return ids;
      },
    );

    // Step 3: Wait 1 hour before email fallback
    await step.sleep("wait-for-in-app-view", "1h");

    // Step 4: Email fallback for unread notifications
    await step.run("send-email-fallback", async () => {
      if (notificationIds.length === 0) {
        return { emailsSent: 0 };
      }

      // Check which notifications are still unread
      const { data: unread } = await supabase
        .from("notifications")
        .select("user_id")
        .in("id", notificationIds)
        .eq("read", false);

      if (!unread || unread.length === 0) {
        return { emailsSent: 0 };
      }

      // Get RFQ details for email
      const { data: rfq } = await supabase
        .from("service_requests")
        .select("title, service_category, target_provider_id")
        .eq("id", rfqId)
        .single();

      if (!rfq) {
        return { emailsSent: 0 };
      }

      // Get email addresses for unread providers
      const unreadUserIds = unread.map(
        (n: { user_id: string }) => n.user_id,
      );

      const { data: users } = await supabase.auth.admin.listUsers();
      const unreadEmails = (users?.users ?? [])
        .filter((u) => unreadUserIds.includes(u.id) && u.email)
        .map((u) => ({ id: u.id, email: u.email as string }));

      let emailsSent = 0;
      for (const recipient of unreadEmails) {
        const result = await sendProviderRfqEmail(
          recipient.email,
          rfq.title as string,
          Boolean(rfq.target_provider_id),
        );
        if (result.sent) {
          emailsSent += 1;
        }
      }

      return { emailsSent };
    });

    return {
      status: "completed",
      rfqId,
      matchedProviders: providers.length,
      notificationsCreated: notificationIds.length,
    };
  },
);
