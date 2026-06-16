-- Planning permission status (NTSELAT material information — closes GAP-M2 declaration gap).
-- NULL means "not declared" (legacy listings remain NULL until next edit).

CREATE TYPE planning_status_type AS ENUM ('granted', 'pending', 'refused', 'none_known');

ALTER TABLE properties
  ADD COLUMN planning_permission_status planning_status_type;

ALTER TABLE seller_listings
  ADD COLUMN planning_permission_status planning_status_type;

COMMENT ON COLUMN properties.planning_permission_status IS
  'Seller/agent-declared planning permission status (NTSELAT material information). NULL = not declared.';
COMMENT ON COLUMN seller_listings.planning_permission_status IS
  'Seller-declared planning permission status (NTSELAT material information). NULL = not declared.';
