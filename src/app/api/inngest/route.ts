import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";
import { priceDropAlerts } from "@/inngest/functions/price-drop-alerts";
import { stripeWebhookDlq } from "@/inngest/functions/stripe-webhook-dlq";
import { jwtHookMonitor } from "@/inngest/functions/jwt-hook-monitor";
import { chainRiskMonitor } from "@/inngest/functions/chain-risk-monitor";
import { quoteAcceptedToBooking } from "@/inngest/functions/quote-accepted-to-booking";
import { gdprUserPurge } from "@/inngest/functions/gdpr-user-purge";
import { pushDispatch } from "@/inngest/functions/push-dispatch";
import { activityLogPartitions } from "@/inngest/functions/activity-log-partitions";
import { truedeedNotifyIntroduction } from "@/inngest/functions/truedeed-notify-introduction";
import { truedeedHashAnchor } from "@/inngest/functions/truedeed-hash-anchor";
import { truedeedExpireIntroductions } from "@/inngest/functions/truedeed-expire-introductions";
import { truedeedPpdIngest } from "@/inngest/functions/truedeed-ppd-ingest";
import {
  truedeedPpdMatch,
  truedeedPpdMatchLookback,
} from "@/inngest/functions/truedeed-ppd-match";
import { truedeedAuditQuery } from "@/inngest/functions/truedeed-audit-query";
import { truedeedReleaseHeldCandidates } from "@/inngest/functions/truedeed-release-held-candidates";
import {
  truedeedInvoiceCreated,
  truedeedInvoicePaymentFailed,
  truedeedInvoiceReminder,
  truedeedInvoiceFinalNotice,
  truedeedInvoiceSuspended,
  truedeedInvoicePaid,
  truedeedMandateBroken,
} from "@/inngest/functions/truedeed-invoice-emails";
import {
  truedeedDunningTick,
  truedeedInvoiceCandidateApproved,
} from "@/inngest/functions/truedeed-dunning-tick";
import {
  truedeedDisputeRaised,
  truedeedDisputeResolved,
  truedeedInvoiceChargedBack,
} from "@/inngest/functions/truedeed-dispute-emails";
import { referencingInitiate } from "@/inngest/functions/referencing-initiate";
import { lifecycleDrip } from "@/inngest/functions/lifecycle-drip";
import { truedeedReportSnapshots } from "@/inngest/functions/truedeed-report-snapshots";
import { platformMetricsDaily } from "@/inngest/functions/platform-metrics-daily";
import { landlordDeadlineDiary } from "@/inngest/functions/landlord-deadline-diary";
import { boxingDayAnnualPush } from "@/inngest/functions/boxing-day-annual-push";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    rfqNotifyProviders,
    priceDropAlerts,
    stripeWebhookDlq,
    jwtHookMonitor,
    chainRiskMonitor,
    quoteAcceptedToBooking,
    gdprUserPurge,
    pushDispatch,
    activityLogPartitions,
    truedeedNotifyIntroduction,
    truedeedHashAnchor,
    truedeedExpireIntroductions,
    truedeedPpdIngest,
    truedeedPpdMatch,
    truedeedPpdMatchLookback,
    truedeedAuditQuery,
    truedeedReleaseHeldCandidates,
    truedeedInvoiceCreated,
    truedeedInvoicePaymentFailed,
    truedeedInvoiceReminder,
    truedeedInvoiceFinalNotice,
    truedeedInvoiceSuspended,
    truedeedInvoicePaid,
    truedeedMandateBroken,
    truedeedDunningTick,
    truedeedInvoiceCandidateApproved,
    truedeedDisputeRaised,
    truedeedDisputeResolved,
    truedeedInvoiceChargedBack,
    referencingInitiate,
    lifecycleDrip,
    truedeedReportSnapshots,
    platformMetricsDaily,
    landlordDeadlineDiary,
    boxingDayAnnualPush,
  ],
});
