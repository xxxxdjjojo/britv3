/**
 * Shared test fixtures for landlord dashboard tests.
 * All fixtures represent minimal valid domain objects used across Wave 0-N test stubs.
 */

export const mockTenantApplication = {
  id: "app-1",
  property_id: "prop-1",
  landlord_id: "user-1",
  applicant_name: "Test Applicant",
  applicant_email: "test@example.com",
  status: "received" as const,
  monthly_income: 3000,
  employment_status: "employed",
  credit_check_status: "pending",
  references_status: "pending",
  notes: null,
  rejection_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockDepositRegistration = {
  id: "dep-1",
  tenancy_id: "ten-1",
  landlord_id: "user-1",
  amount: 1500,
  scheme: "TDS" as const,
  scheme_reference: "TDS123456",
  registration_date: "2026-01-01",
  prescribed_info_sent_date: "2026-01-01",
  status: "registered" as const,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockInventoryReport = {
  id: "inv-1",
  property_id: "prop-1",
  tenancy_id: "ten-1",
  landlord_id: "user-1",
  type: "check_in" as const,
  status: "draft" as const,
  rooms: [],
  notes: "",
  photo_urls: [] as string[],
  completed_at: null,
  created_at: new Date().toISOString(),
};

export const mockLegalNotice = {
  id: "notice-1",
  property_id: "prop-1",
  tenancy_id: "ten-1",
  landlord_id: "user-1",
  notice_type: "section_21" as const,
  possession_date: "2026-06-01",
  deposit_scheme_reference: "TDS123456",
  epc_provided: true,
  gas_safety_provided: true,
  grounds: [] as string[],
  arrears_amount: null,
  served_date: null,
  pdf_storage_path: null,
  status: "draft" as const,
  created_at: new Date().toISOString(),
};

export const mockPortfolioKPI = {
  total_properties: 3,
  occupied: 2,
  vacant: 1,
  occupancy_rate: 67,
  total_monthly_rent: 4500,
  compliance_alerts: 1,
  open_maintenance: 2,
  expired_compliance: 0,
};

export const mockTenancy = {
  id: "ten-1",
  property_id: "prop-1",
  landlord_id: "user-1",
  tenant_id: "tenant-1",
  lease_start_date: "2025-01-01",
  lease_end_date: "2026-01-01",
  rent_amount: 1500,
  rent_frequency: "monthly",
  status: "active",
  created_at: new Date().toISOString(),
};

export const mockProperty = {
  id: "prop-1",
  landlord_id: "user-1",
  address_line_1: "42 Baker Street",
  address_line_2: null,
  city: "London",
  postcode: "NW1 6XE",
  property_type: "flat",
  bedrooms: 2,
  created_at: new Date().toISOString(),
};
