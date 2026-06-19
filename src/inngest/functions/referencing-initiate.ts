/**
 * Inngest function: handle a requested tenant referencing check.
 *
 * startReferencing() already calls the provider's initiateCheck synchronously
 * and stamps the application. This function exists so the (potentially slow)
 * provider hand-off has its own retry/observability envelope and a single place
 * to extend once a real provider needs async polling or follow-up calls.
 */

import { inngest } from "@/inngest/client";

export const referencingInitiate = inngest.createFunction(
  {
    id: "referencing-initiate",
    name: "Initiate tenant referencing check",
  },
  { event: "referencing/check.requested" },
  async ({ event, step }) => {
    const { applicationId, externalRef, provider } = event.data as {
      applicationId: string;
      externalRef: string;
      provider: string;
    };

    await step.run("log-requested", async () => {
      // The application is already marked pending by startReferencing(); this
      // step is the extension point for real providers (poll status, schedule
      // reminders, etc.). For the mock provider it is a no-op acknowledgement.
      return { applicationId, externalRef, provider };
    });

    return { status: "requested", applicationId, externalRef, provider };
  },
);
