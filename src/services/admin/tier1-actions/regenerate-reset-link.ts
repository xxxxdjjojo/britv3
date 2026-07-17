import { sendPasswordReset } from "@/services/email/email-service";
import type { Tier1Action, Tier1ActionContext } from "./types";
import { Tier1ActionError } from "./types";

/**
 * Regenerate a password-reset link and email it to the account address.
 *
 * HIGH RISK — a reset link is an account-takeover primitive. Guards:
 *  - gated on `manage_credentials` (super_admin only),
 *  - `requiresApproval` in preview,
 *  - the link is generated and handed straight to the email service; it is
 *    NEVER returned to the caller, logged, or displayed. The only recipient is
 *    the account's own verified email.
 */

type AuthUserLite = { id: string; email: string | null; firstName: string };

async function loadAuthUser(ctx: Tier1ActionContext): Promise<AuthUserLite> {
  const { data, error } = await ctx.supabase.auth.admin.getUserById(ctx.targetId);
  if (error || !data?.user) {
    throw new Tier1ActionError("User not found", 404);
  }
  const user = data.user;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? null,
    firstName: typeof metadata.first_name === "string" ? metadata.first_name : "",
  };
}

export const regenerateResetLink: Tier1Action = {
  key: "regenerate-reset-link",
  label: "Email password-reset link",
  description:
    "Generate a password-reset link and email it to the account's own address. The link is never shown here — only the account holder receives it.",
  requiredPermission: "manage_credentials",
  targetType: "user",
  risk: "high",
  reversible: false,

  async preview(ctx) {
    const user = await loadAuthUser(ctx);
    const blockers: string[] = [];
    if (!user.email) blockers.push("Account has no email address on file.");
    return {
      summary: user.email
        ? `Email a password-reset link to the account address (ending …${user.email.slice(-4)}).`
        : "Cannot send — no email on file.",
      effects: [
        "Generates a one-time password-reset link.",
        "Emails it ONLY to the account's own address. The link is not shown here.",
      ],
      reversible: false,
      requiresApproval: true,
      blockers,
    };
  },

  async execute(ctx) {
    const user = await loadAuthUser(ctx);
    if (!user.email) throw new Tier1ActionError("Account has no email address", 422);

    const { data, error } = await ctx.supabase.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
    });
    const actionLink = data?.properties?.action_link;
    if (error || !actionLink) {
      throw new Tier1ActionError("Failed to generate reset link", 502);
    }

    await sendPasswordReset({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      resetUrl: actionLink,
    });

    // No link/token in the summary — email is the only delivery channel.
    return { summary: "Password-reset link emailed to the account address." };
  },
};
