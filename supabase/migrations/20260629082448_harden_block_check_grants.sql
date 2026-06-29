-- Harden EXECUTE grants on is_conversation_blocked_by_recipient().
--
-- Migration 20260627192215 already declared authenticated-only EXECUTE, but on
-- production the function was hand-applied as raw SQL (only the CREATE FUNCTION
-- body ran), so the default `GRANT EXECUTE TO PUBLIC` was never revoked. That
-- left `anon` able to call it. It is NOT exploitable — the body keys on
-- auth.uid(), which is NULL for anon, so an anonymous caller always gets `false`
-- and learns nothing — but it is broader than intended.
--
-- This migration re-asserts the intended grants idempotently so prod matches the
-- committed source: only authenticated users (the only caller — the messaging
-- routes use the user-scoped server client) may execute it. Re-running is safe.

REVOKE ALL ON FUNCTION public.is_conversation_blocked_by_recipient(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conversation_blocked_by_recipient(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_blocked_by_recipient(uuid) TO authenticated;
