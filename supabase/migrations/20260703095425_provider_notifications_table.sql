-- ===========================================================================
-- Create the in-app `notifications` table that three features have been
-- writing to since Phase 3 — it was never created by any migration, so on
-- prod every insert silently failed (rfq-notify-providers probed for the
-- table and skipped; price-drop-alerts likewise; the landlord rent-reminder
-- audit insert swallowed the error).
--
-- Writers: rfq-notify-providers (Inngest, admin client), price-drop-alerts
-- (Inngest, admin client), /api/landlord/batch/reminders (user client —
-- needs the own-row INSERT policy).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Owners read their own notifications.
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Owners can mark their own notifications read (and only flip their own rows).
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- The landlord rent-reminder route inserts an own-row audit record with the
-- user-scoped client; Inngest writers use the service role and bypass RLS.
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
