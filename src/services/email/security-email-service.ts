/**
 * Security alert email service — stub.
 * TODO: Implement actual security alert emails (password change, MFA enroll/unenroll, email change).
 */

type SecurityAlertInput = {
  userId: string;
  email: string;
  firstName: string;
  eventType: string;
};

export async function sendSecurityAlert(
  _input: SecurityAlertInput,
): Promise<void> {
  // TODO: Wire up Resend email delivery for security alerts
  console.warn("[security-email] sendSecurityAlert stub called — email not sent");
}
