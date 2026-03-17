-- Add success/error tracking to admin audit log
-- NULL values indicate legacy entries (before this migration)
ALTER TABLE admin_audit_log
  ADD COLUMN success boolean,
  ADD COLUMN error_message text;

COMMENT ON COLUMN admin_audit_log.success IS 'Whether the audited action succeeded. NULL = legacy entry.';
COMMENT ON COLUMN admin_audit_log.error_message IS 'Error message if the action failed. NULL = success or legacy entry.';
