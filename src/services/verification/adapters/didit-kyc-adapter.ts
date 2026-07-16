/**
 * Didit KYC adapter — creates hosted identity-verification sessions via the
 * Didit REST v3 API. Server-only (uses the secret api key).
 *
 * vendor_data carries our userId so webhook events can be correlated back to
 * the profile; callback is where Didit redirects the user afterwards.
 */

import { env } from "@/env";
import type {
  KycProvider,
  KycSession,
  KycSessionRequest,
} from "@/services/verification/kyc-provider";

const DIDIT_SESSION_URL = "https://verification.didit.me/v3/session/";

type DiditSessionResponse = Readonly<{
  session_id?: string;
  url?: string;
}>;

export class DiditKycAdapter implements KycProvider {
  readonly name = "didit";

  async createSession(req: KycSessionRequest): Promise<KycSession> {
    const apiKey = env.KYC_API_KEY;
    const workflowId = env.DIDIT_WORKFLOW_ID;
    if (!apiKey || !workflowId) {
      throw new Error(
        "Didit KYC is not configured (KYC_API_KEY / DIDIT_WORKFLOW_ID missing)",
      );
    }

    const res = await fetch(DIDIT_SESSION_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: req.userId,
        ...(req.returnUrl ? { callback: req.returnUrl } : {}),
      }),
    });

    if (!res.ok) {
      throw new Error(`Didit session create failed (${res.status})`);
    }

    const data = (await res.json()) as DiditSessionResponse;
    if (!data.session_id || !data.url) {
      throw new Error("Didit session response missing session_id/url");
    }

    return {
      providerRef: data.session_id,
      status: "pending",
      redirectUrl: data.url,
    };
  }
}
