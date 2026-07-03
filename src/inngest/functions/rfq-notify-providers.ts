/**
 * Inngest function: Notify matched providers when an RFQ is created.
 *
 * Direct (targeted) request — the customer chose this specific trader:
 * 1. Create an in-app notification for the target provider
 * 2. Email them immediately (no fallback wait; latency matters for won jobs)
 *
 * Broadcast request:
 * 1. Find matching providers by category/location/rating
 * 2. Create in-app notifications
 * 3. Wait 1 hour
 * 4. Email fallback for providers whose notification is still unread
 */

import { inngest } from "@/inngest/client";
import { matchProvidersForRfq } from "@/services/marketplace/rfq-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendProviderRfqEmail } from "@/services/notifications/email-service";

type RfqRow = Readonly<{
  title: string;
  service_category: string;
  target_provider_id: string | null;
}>;

export const rfqNotifyProviders = inngest.createFunction(
  {
    id: "rfq-notify-providers",
    name: "Notify providers about new RFQ",
  },
  { event: "marketplace/rfq.created" },
  async ({ event, step }) => {
    const { rfqId } = event.data as { rfqId: string };
    const supabase = createAdminClient();

    // Step 1: Get matching providers (a targeted RFQ matches only its target)
    const providers = await step.run("get-matching-providers", async () => {
      return matchProvidersForRfq(supabase, rfqId);
    });

    if (providers.length === 0) {
      return { status: "no_matching_providers", rfqId };
    }

    // Step 2: Create in-app notifications for each matched provider
    const notified = await step.run("send-in-app-notifications", async () => {
      const ids: string[] = [];

      const { data: rfqRow } = await supabase
        .from("service_requests")
        .select("title, service_category, target_provider_id")
        .eq("id", rfqId)
        .single();

      if (!rfqRow) {
        console.warn(`RFQ ${rfqId} not found when creating notifications`);
        return { ids, rfq: null as RfqRow | null };
      }

      const rfq = rfqRow as RfqRow;
      const isDirect = Boolean(rfq.target_provider_id);

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

        if (error) {
          console.warn(
            `Failed to create rfq_match notification for ${provider.user_id}: ${error.message}`,
          );
        } else if (notification) {
          ids.push(notification.id as string);
        }
      }

      return { ids, rfq };
    });

    // Direct request: email the target immediately — no 1h fallback dance.
    if (notified.rfq?.target_provider_id) {
      const directResult = await step.run("send-direct-email", async () => {
        const rfq = notified.rfq as RfqRow;
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", rfq.target_provider_id as string)
          .single();

        if (!profile?.email) {
          return { emailsSent: 0 };
        }

        const result = await sendProviderRfqEmail(
          profile.email as string,
          rfq.title,
          true,
        );
        return { emailsSent: result.sent ? 1 : 0 };
      });

      return {
        status: "completed_direct",
        rfqId,
        matchedProviders: providers.length,
        notificationsCreated: notified.ids.length,
        emailsSent: directResult.emailsSent,
      };
    }

    // Step 3: Wait 1 hour before email fallback
    await step.sleep("wait-for-in-app-view", "1h");

    // Step 4: Email fallback for unread notifications
    await step.run("send-email-fallback", async () => {
      if (notified.ids.length === 0) {
        return { emailsSent: 0 };
      }

      // Check which notifications are still unread
      const { data: unread } = await supabase
        .from("notifications")
        .select("user_id")
        .in("id", notified.ids)
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
          false,
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
      notificationsCreated: notified.ids.length,
    };
  },
);
