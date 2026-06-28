-- Fail-CLOSED conversation block check.
--
-- RLS on `conversation_read_status` is `USING (user_id = auth.uid())`, so a
-- SENDER cannot read the RECIPIENT's row. The in-app block check therefore read
-- zero rows and fail-OPENED: a blocked recipient still received messages.
--
-- This SECURITY DEFINER function reads past RLS, but is tightly scoped so it
-- cannot become a "did X block Y" oracle:
--   * it only answers for a conversation the CALLER participates in, and
--   * it only reports on the OTHER participant's block flag, and
--   * it returns a single boolean — never the recipient's row (which also holds
--     their private draft_text / archived_at).
--
-- A row-level RLS grant was rejected on purpose: RLS is row-level, so letting the
-- sender read the recipient's row would leak draft_text + archived_at too.

CREATE OR REPLACE FUNCTION public.is_conversation_blocked_by_recipient(
  p_conversation_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.conversation_read_status crs
      ON crs.conversation_id = c.id
    WHERE c.id = p_conversation_id
      -- caller must be a participant of this conversation
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
      -- ...and we only look at the OTHER participant's block flag
      AND crs.user_id <> auth.uid()
      AND crs.blocked_at IS NOT NULL
  );
$$;

-- Only authenticated users may call it; the body's participant check does the
-- real authorization.
REVOKE ALL ON FUNCTION public.is_conversation_blocked_by_recipient(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_conversation_blocked_by_recipient(uuid) TO authenticated;
