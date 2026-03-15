-- Migration: add builder, plasterer, painter, carpenter to service_category enum
-- These values were missing, causing marketplace category tiles to fall back to
-- ?category=handyman (builders) or ?category=other (plasterers, painters, carpenters).
-- The live enum name on this project is service_category (not trade_service_type).

ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'builder';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'plasterer';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'painter';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'carpenter';
