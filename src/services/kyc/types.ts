export type KycCheckResult = {
  checkId: string;
  status: "pending" | "processing" | "approved" | "declined";
  redirectUrl?: string;
};

export type KycProvider = {
  name: string;
  initCheck(userId: string): Promise<KycCheckResult>;
  getStatus(checkId: string): Promise<KycCheckResult>;
  handleWebhook(payload: unknown): Promise<{ userId: string; status: string }>;
};
