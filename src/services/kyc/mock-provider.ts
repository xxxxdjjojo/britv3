import type { KycProvider, KycCheckResult } from "./types";

/** Mock KYC provider for development/testing — auto-approves after 2 seconds */
export const mockKycProvider: KycProvider = {
  name: "mock",

  async initCheck(userId: string): Promise<KycCheckResult> {
    return {
      checkId: `mock_${userId}_${Date.now()}`,
      status: "processing",
      redirectUrl: undefined,
    };
  },

  async getStatus(checkId: string): Promise<KycCheckResult> {
    // In mock mode, auto-approve after 2 seconds from creation
    const timestamp = parseInt(checkId.split("_").pop() || "0", 10);
    const elapsed = Date.now() - timestamp;
    return {
      checkId,
      status: elapsed > 2000 ? "approved" : "processing",
    };
  },

  async handleWebhook(payload: unknown): Promise<{ userId: string; status: string }> {
    const p = payload as { checkId?: string; status?: string };
    const userId = p.checkId?.split("_")[1] || "";
    return { userId, status: p.status || "approved" };
  },
};
