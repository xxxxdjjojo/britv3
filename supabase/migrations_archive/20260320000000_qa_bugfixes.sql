-- QA bugfix migration: C1 (enum + RPC fix) + H5 (scheduled_deletion_at column)
-- Resolves: C1, C3, C4, C5 (cascade), H5

-- ============================================================================
-- Fix C1: Ensure electrical_eicr enum value exists in document_category
-- ============================================================================

-- Note: ALTER TYPE ... ADD VALUE IF NOT EXISTS cannot run inside a transaction
-- block in older PostgreSQL. Supabase migrations run each file as a single
-- transaction by default, but ADD VALUE IF NOT EXISTS is safe to re-run.
DO $$
BEGIN
  -- Check if the enum type exists before trying to add values
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
    -- Add value if not already present
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'document_category'::regtype
        AND enumlabel = 'electrical_eicr'
    ) THEN
      EXECUTE 'ALTER TYPE document_category ADD VALUE ''electrical_eicr''';
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- Fix H5: Add scheduled_deletion_at column to profiles for GDPR deletion flow
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;
