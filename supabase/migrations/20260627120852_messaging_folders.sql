-- Folders data model for the messaging inbox.
-- Extends per-(conversation, user) state in conversation_read_status with
-- archive, per-conversation block, and draft fields; surfaces them (plus a
-- has_sent flag) through get_inbox_for_user so the inbox can render Inbox /
-- Unread / Sent / Drafts / Archived / Spam folders.
--
-- RLS note: conversation_read_status already has owner-scoped RLS
-- (policy read_status_all: FOR ALL USING/ WITH CHECK user_id = auth.uid()),
-- so the owning user may already write these new columns. No policy change.

-- 1. New per-user conversation state columns.
ALTER TABLE public.conversation_read_status
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS draft_text text,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz;

-- 2. Extend get_inbox_for_user. The RETURNS TABLE signature changes (new OUT
-- columns), so Postgres requires DROP + CREATE rather than CREATE OR REPLACE.
DROP FUNCTION IF EXISTS get_inbox_for_user(uuid);

CREATE FUNCTION get_inbox_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid, participant_1_id uuid, participant_2_id uuid,
  context_type text, context_id uuid, last_message_at timestamptz,
  created_at timestamptz, participant_name text,
  last_message_preview text, unread_count bigint,
  archived_at timestamptz, blocked_at timestamptz,
  draft_text text, has_sent boolean
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH my_convs AS (
    SELECT * FROM conversations
    WHERE participant_1_id = p_user_id OR participant_2_id = p_user_id
    ORDER BY last_message_at DESC
  ),
  other_ids AS (
    SELECT id AS conv_id,
      CASE WHEN participant_1_id = p_user_id
        THEN participant_2_id ELSE participant_1_id END AS other_id
    FROM my_convs
  ),
  names AS (
    SELECT o.conv_id, p.display_name
    FROM other_ids o
    JOIN profiles p ON p.id = o.other_id
  ),
  previews AS (
    SELECT DISTINCT ON (conversation_id) conversation_id, content
    FROM messages ORDER BY conversation_id, created_at DESC
  ),
  read_status AS (
    SELECT conversation_id, last_read_at FROM conversation_read_status
    WHERE user_id = p_user_id
  ),
  state AS (
    SELECT conversation_id, archived_at, blocked_at, draft_text
    FROM conversation_read_status
    WHERE user_id = p_user_id
  ),
  unread AS (
    SELECT m.conversation_id, COUNT(*) AS cnt
    FROM messages m
    LEFT JOIN read_status rs ON rs.conversation_id = m.conversation_id
    WHERE m.sender_id <> p_user_id
      AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01')
    GROUP BY m.conversation_id
  )
  SELECT c.id, c.participant_1_id, c.participant_2_id,
    c.context_type::text, c.context_id, c.last_message_at, c.created_at,
    n.display_name AS participant_name,
    LEFT(pr.content, 100) AS last_message_preview,
    COALESCE(u.cnt, 0) AS unread_count,
    st.archived_at, st.blocked_at, st.draft_text,
    EXISTS (
      SELECT 1 FROM messages m2
      WHERE m2.conversation_id = c.id AND m2.sender_id = p_user_id
    ) AS has_sent
  FROM my_convs c
  LEFT JOIN names n ON n.conv_id = c.id
  LEFT JOIN previews pr ON pr.conversation_id = c.id
  LEFT JOIN unread u ON u.conversation_id = c.id
  LEFT JOIN state st ON st.conversation_id = c.id;
$$;
