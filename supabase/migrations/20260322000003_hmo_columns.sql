-- Add HMO fields to properties table.
-- HMO status is orthogonal to property_type (a terraced house can be an HMO).
ALTER TABLE properties
  ADD COLUMN is_hmo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN hmo_licence_number TEXT,
  ADD COLUMN hmo_licence_expiry DATE;

CREATE INDEX idx_properties_is_hmo ON properties(is_hmo) WHERE is_hmo = TRUE;

COMMENT ON COLUMN properties.is_hmo IS 'Whether this property is a House in Multiple Occupation (HMO), triggering additional compliance requirements';
COMMENT ON COLUMN properties.hmo_licence_number IS 'Local authority HMO licence reference number';
COMMENT ON COLUMN properties.hmo_licence_expiry IS 'HMO licence expiry date — renewal applications typically take 8-12 weeks';
