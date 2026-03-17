-- get_inbox_for_user: replaces 4N+1 queries with 1 CTE query
CREATE OR REPLACE FUNCTION get_inbox_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid, participant_1_id uuid, participant_2_id uuid,
  context_type text, context_id uuid, last_message_at timestamptz,
  created_at timestamptz, participant_name text,
  last_message_preview text, unread_count bigint
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
    COALESCE(u.cnt, 0) AS unread_count
  FROM my_convs c
  LEFT JOIN names n ON n.conv_id = c.id
  LEFT JOIN previews pr ON pr.conversation_id = c.id
  LEFT JOIN unread u ON u.conversation_id = c.id;
$$;

-- get_unread_count: replaces N×2 queries with 1 query
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id uuid)
RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(DISTINCT m.conversation_id)
  FROM conversations c
  JOIN messages m ON m.conversation_id = c.id
  LEFT JOIN conversation_read_status rs
    ON rs.conversation_id = c.id AND rs.user_id = p_user_id
  WHERE (c.participant_1_id = p_user_id OR c.participant_2_id = p_user_id)
    AND m.sender_id <> p_user_id
    AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01');
$$;
