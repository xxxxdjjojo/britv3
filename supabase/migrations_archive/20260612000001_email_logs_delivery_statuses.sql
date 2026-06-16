-- The Resend delivery webhook (/api/webhooks/resend) records post-send
-- delivery outcomes — the notification email is dispute evidence (Truedeed
-- attribution spec §3), so delivery status must be storable, not just send
-- status. The original check only allowed send-time states.

alter table public.email_logs
  drop constraint if exists email_logs_status_check;

alter table public.email_logs
  add constraint email_logs_status_check
  check (status in ('sent', 'failed', 'suppressed', 'delivered', 'bounced'));
