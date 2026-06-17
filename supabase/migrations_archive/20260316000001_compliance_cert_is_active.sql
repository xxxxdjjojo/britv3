-- Add is_active column to property_documents for soft-archive on re-upload
ALTER TABLE property_documents ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Index for compliance queries that filter by is_active
CREATE INDEX IF NOT EXISTS idx_property_documents_active
ON property_documents (property_id, category, is_active)
WHERE is_active = true;
