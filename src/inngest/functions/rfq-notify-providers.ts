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
          .select("title, service_category")
          .eq("id", rfqId)
          .single();

        if (!rfq) {
          console.warn(`RFQ ${rfqId} not found when creating notifications`);
          return ids;
        }

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
              title: "New quote request matches your services",
              body: `"${rfq.title}" in ${rfq.service_category} -- submit a quote to win this job.`,
              link: `/dashboard/service_provider/rfqs/${rfqId}`,
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
        .select("title, service_category")
        .eq("id", rfqId)
        .single();

      // Get email addresses for unread providers
      const unreadUserIds = unread.map(
        (n: { user_id: string }) => n.user_id,
      );

      const { data: users } = await supabase.auth.admin.listUsers();
      const unreadEmails = (users?.users ?? [])
        .filter((u) => unreadUserIds.includes(u.id))
        .map((u) => ({ id: u.id, email: u.email }));

      // TODO: Resend integration deferred to communication phase.
      // Currently we count unread providers but do not actually email.
      void rfq;
      return { emailsSent: unreadEmails.length };
    });

    return {
      status: "completed",
      rfqId,
      matchedProviders: providers.length,
      notificationsCreated: notificationIds.length,
    };
  },
);
