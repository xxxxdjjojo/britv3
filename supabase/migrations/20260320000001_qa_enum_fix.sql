-- Fix: Ensure missing enum values exist in document_category.
-- ADD VALUE IF NOT EXISTS is safe in PG 12+ and idempotent.

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'electrical_eicr';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'inspection_report';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'receipt';
