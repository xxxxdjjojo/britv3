import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SCREENSHOT_DIR = "docs/qa-screenshots/stage-flows";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function checkPage(page: Page, url: string, name: string) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  // Wait for hydration
  await page.waitForTimeout(1500);

  const status = response?.status() ?? 0;
  const title = await page.title();

  // Check for error states
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const hasError =
    bodyText.includes("Application error") ||
    bodyText.includes("Internal Server Error") ||
    bodyText.includes("This page could not be found") ||
    bodyText.includes("NEXT_NOT_FOUND");

  // Take screenshot
  const safeName = name.replace(/[^a-zA-Z0-9-]/g, "-");
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${safeName}.png`,
    fullPage: false,
  });

  // Console errors
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  expect(status, `${name} returned HTTP ${status}`).toBeLessThan(500);
  expect(hasError, `${name} shows error content`).toBe(false);
}

async function login(page: Page, email: string, password: string) {
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.waitForTimeout(1000);

  // Check if already on dashboard (existing session)
  if (page.url().includes("/dashboard") || page.url().includes("/admin")) {
    return;
  }

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

// ─── PUBLIC PAGES ─────────────────────────────────────────────────────────────

const PUBLIC_PAGES = [
  ["/", "public-homepage"],
  ["/about", "public-about"],
  ["/how-it-works", "public-how-it-works"],
  ["/contact", "public-contact"],
  ["/pricing", "public-pricing"],
  ["/careers", "public-careers"],
  ["/jobs", "public-jobs"],
  ["/investors", "public-investors"],
  ["/partners", "public-partners"],
  ["/press", "public-press"],
  ["/sitemap-page", "public-sitemap"],
  ["/overview", "public-overview"],
  ["/valuation", "public-valuation"],
  ["/search", "public-search"],
  ["/compare", "public-compare"],
  ["/compare/properties", "public-compare-properties"],
  ["/sold-prices", "public-sold-prices"],
  ["/areas", "public-areas"],
  ["/market-trends", "public-market-trends"],
  ["/market-trends/national", "public-market-trends-national"],
  ["/marketplace", "public-marketplace"],
  ["/services", "public-services"],
  ["/services/architects", "public-services-architects"],
  ["/services/conveyancers", "public-services-conveyancers"],
  ["/services/letting-agents", "public-services-letting-agents"],
  ["/services/mortgage-brokers", "public-services-mortgage-brokers"],
  ["/services/surveyors", "public-services-surveyors"],
  ["/services/tradespeople", "public-services-tradespeople"],
  ["/agents", "public-agents"],
  ["/letting-agents", "public-letting-agents"],
  ["/architects", "public-architects"],
  ["/conveyancers", "public-conveyancers"],
  ["/mortgage-brokers", "public-mortgage-brokers"],
  ["/surveyors", "public-surveyors"],
  ["/reviews", "public-reviews"],
  ["/blog", "public-blog"],
  ["/tools", "public-tools"],
  ["/tools/mortgage-calculator", "public-mortgage-calculator"],
  ["/tools/stamp-duty-calculator", "public-stamp-duty-calculator"],
  ["/tools/affordability-calculator", "public-affordability-calculator"],
  ["/tools/rental-yield-calculator", "public-rental-yield-calculator"],
  ["/tools/buy-vs-rent-calculator", "public-buy-vs-rent-calculator"],
  ["/tools/energy-bill-estimator", "public-energy-bill-estimator"],
  ["/tools/equity-calculator", "public-equity-calculator"],
  ["/tools/first-time-buyer-guide", "public-first-time-buyer-guide"],
  ["/tools/investment-calculator", "public-investment-calculator"],
  ["/tools/ltv-calculator", "public-ltv-calculator"],
  ["/tools/mortgage-comparison", "public-mortgage-comparison"],
  ["/tools/moving-cost-estimator", "public-moving-cost-estimator"],
  ["/tools/overpayment-calculator", "public-overpayment-calculator"],
  ["/tools/remortgage-calculator", "public-remortgage-calculator"],
  ["/post-a-job", "public-post-a-job"],
  ["/help", "public-help"],
  ["/help/contact", "public-help-contact"],
  ["/legal", "public-legal"],
  ["/legal/terms", "public-legal-terms"],
  ["/legal/privacy", "public-legal-privacy"],
  ["/legal/cookies", "public-legal-cookies"],
  ["/legal/accessibility", "public-legal-accessibility"],
  ["/legal/acceptable-use", "public-legal-acceptable-use"],
  ["/legal/ai-transparency", "public-legal-ai-transparency"],
  ["/legal/aml-policy", "public-legal-aml-policy"],
  ["/legal/complaints", "public-legal-complaints"],
  ["/legal/data-processing", "public-legal-data-processing"],
  ["/legal/disclaimer", "public-legal-disclaimer"],
  ["/legal/fair-housing", "public-legal-fair-housing"],
  ["/legal/fee-transparency", "public-legal-fee-transparency"],
  ["/legal/gdpr-rights", "public-legal-gdpr-rights"],
  ["/legal/modern-slavery", "public-legal-modern-slavery"],
  ["/legal/professional-standards", "public-legal-professional-standards"],
  ["/legal/refund-policy", "public-legal-refund-policy"],
  ["/legal/regulatory-information", "public-legal-regulatory-information"],
  ["/legal/review-policy", "public-legal-review-policy"],
  ["/legal/third-party-services", "public-legal-third-party-services"],
  ["/forbidden", "public-forbidden"],
  ["/maintenance", "public-maintenance"],
  ["/offline", "public-offline"],
  ["/rate-limited", "public-rate-limited"],
  ["/session-expired", "public-session-expired"],
] as const;

test.describe("Public Pages", () => {
  for (const [path, name] of PUBLIC_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────

const AUTH_PAGES = [
  ["/login", "auth-login"],
  ["/register", "auth-register"],
  ["/register/role-select", "auth-role-select"],
  ["/forgot-password", "auth-forgot-password"],
  ["/reset-password", "auth-reset-password"],
  ["/verify-email", "auth-verify-email"],
  ["/verify-email/confirmed", "auth-verify-email-confirmed"],
  ["/two-factor", "auth-two-factor"],
  ["/two-factor-setup", "auth-two-factor-setup"],
  ["/account-locked", "auth-account-locked"],
  ["/account-suspended", "auth-account-suspended"],
] as const;

test.describe("Auth Pages", () => {
  for (const [path, name] of AUTH_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── HOMEBUYER DASHBOARD ─────────────────────────────────────────────────────

const HOMEBUYER_PAGES = [
  ["/dashboard/homebuyer", "homebuyer-dashboard"],
  ["/dashboard/homebuyer/saved", "homebuyer-saved"],
  ["/dashboard/homebuyer/searches", "homebuyer-searches"],
  ["/dashboard/homebuyer/viewings", "homebuyer-viewings"],
  ["/dashboard/homebuyer/viewings/book", "homebuyer-viewings-book"],
  ["/dashboard/homebuyer/viewings/calendar", "homebuyer-viewings-calendar"],
  ["/dashboard/homebuyer/offers", "homebuyer-offers"],
  ["/dashboard/homebuyer/documents", "homebuyer-documents"],
  ["/dashboard/homebuyer/messages", "homebuyer-messages"],
  ["/dashboard/homebuyer/moving", "homebuyer-moving"],
  ["/dashboard/homebuyer/services", "homebuyer-services"],
  ["/dashboard/homebuyer/ai-match", "homebuyer-ai-match"],
  ["/dashboard/homebuyer/calculators", "homebuyer-calculators"],
  ["/dashboard/homebuyer/billing", "homebuyer-billing"],
  ["/dashboard/homebuyer/billing/invoices", "homebuyer-billing-invoices"],
  ["/dashboard/homebuyer/billing/payment-methods", "homebuyer-billing-payment-methods"],
  ["/dashboard/homebuyer/billing/subscription", "homebuyer-billing-subscription"],
  ["/dashboard/homebuyer/referrals", "homebuyer-referrals"],
  ["/dashboard/homebuyer/verification", "homebuyer-verification"],
  ["/dashboard/homebuyer/applications", "homebuyer-applications"],
  ["/dashboard/homebuyer/tenancy", "homebuyer-tenancy"],
  ["/dashboard/homebuyer/listings", "homebuyer-listings"],
] as const;

test.describe("Homebuyer Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/homebuyer.json",
  });

  for (const [path, name] of HOMEBUYER_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── RENTER DASHBOARD ─────────────────────────────────────────────────────────

const RENTER_PAGES = [
  ["/dashboard/renter", "renter-dashboard"],
  ["/dashboard/renter/saved", "renter-saved"],
  ["/dashboard/renter/searches", "renter-searches"],
  ["/dashboard/renter/viewings", "renter-viewings"],
  ["/dashboard/renter/viewings/book", "renter-viewings-book"],
  ["/dashboard/renter/viewings/calendar", "renter-viewings-calendar"],
  ["/dashboard/renter/applications", "renter-applications"],
  ["/dashboard/renter/tenancy", "renter-tenancy"],
  ["/dashboard/renter/documents", "renter-documents"],
  ["/dashboard/renter/messages", "renter-messages"],
  ["/dashboard/renter/services", "renter-services"],
  ["/dashboard/renter/ai-match", "renter-ai-match"],
  ["/dashboard/renter/calculators", "renter-calculators"],
  ["/dashboard/renter/billing", "renter-billing"],
  ["/dashboard/renter/referrals", "renter-referrals"],
  ["/dashboard/renter/verification", "renter-verification"],
] as const;

test.describe("Renter Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/renter.json",
  });

  for (const [path, name] of RENTER_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── SELLER DASHBOARD ─────────────────────────────────────────────────────────

const SELLER_PAGES = [
  ["/dashboard/seller", "seller-dashboard"],
  ["/dashboard/seller/listings", "seller-listings"],
  ["/dashboard/seller/listings/create", "seller-listings-create"],
  ["/dashboard/seller/offers", "seller-offers"],
  ["/dashboard/seller/enquiries", "seller-enquiries"],
  ["/dashboard/seller/enquiries-viewings", "seller-enquiries-viewings"],
  ["/dashboard/seller/viewings", "seller-viewings"],
  ["/dashboard/seller/agents", "seller-agents"],
  ["/dashboard/seller/agents/compare", "seller-agents-compare"],
  ["/dashboard/seller/analytics", "seller-analytics"],
  ["/dashboard/seller/valuation", "seller-valuation"],
  ["/dashboard/seller/documents", "seller-documents"],
  ["/dashboard/seller/messages", "seller-messages"],
  ["/dashboard/seller/billing", "seller-billing"],
  ["/dashboard/seller/referrals", "seller-referrals"],
  ["/dashboard/seller/verification", "seller-verification"],
] as const;

test.describe("Seller Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/seller.json",
  });

  for (const [path, name] of SELLER_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── LANDLORD DASHBOARD ──────────────────────────────────────────────────────

const LANDLORD_PAGES = [
  ["/dashboard/landlord", "landlord-dashboard"],
  ["/dashboard/landlord/properties", "landlord-properties"],
  ["/dashboard/landlord/properties/add", "landlord-properties-add"],
  ["/dashboard/landlord/tenants", "landlord-tenants"],
  ["/dashboard/landlord/maintenance", "landlord-maintenance"],
  ["/dashboard/landlord/rent", "landlord-rent"],
  ["/dashboard/landlord/deposits", "landlord-deposits"],
  ["/dashboard/landlord/compliance", "landlord-compliance"],
  ["/dashboard/landlord/compliance/matrix", "landlord-compliance-matrix"],
  ["/dashboard/landlord/compliance/alerts", "landlord-compliance-alerts"],
  ["/dashboard/landlord/compliance/upload", "landlord-compliance-upload"],
  ["/dashboard/landlord/compliance-guide", "landlord-compliance-guide"],
  ["/dashboard/landlord/finance/expenses", "landlord-finance-expenses"],
  ["/dashboard/landlord/finance/report", "landlord-finance-report"],
  ["/dashboard/landlord/finance/tax", "landlord-finance-tax"],
  ["/dashboard/landlord/analytics", "landlord-analytics"],
  ["/dashboard/landlord/insurance", "landlord-insurance"],
  ["/dashboard/landlord/legal/notices", "landlord-legal-notices"],
  ["/dashboard/landlord/find-agent", "landlord-find-agent"],
  ["/dashboard/landlord/find-tradespeople", "landlord-find-tradespeople"],
  ["/dashboard/landlord/tools/yield-calculator", "landlord-yield-calculator"],
  ["/dashboard/landlord/billing", "landlord-billing"],
  ["/dashboard/landlord/referrals", "landlord-referrals"],
  ["/dashboard/landlord/verification", "landlord-verification"],
  ["/dashboard/landlord/messages", "landlord-messages"],
  ["/dashboard/landlord/documents", "landlord-documents"],
] as const;

test.describe("Landlord Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/landlord.json",
  });

  for (const [path, name] of LANDLORD_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── AGENT DASHBOARD ─────────────────────────────────────────────────────────

const AGENT_PAGES = [
  ["/dashboard/agent", "agent-dashboard"],
  ["/dashboard/agent/listings", "agent-listings"],
  ["/dashboard/agent/listings/create", "agent-listings-create"],
  ["/dashboard/agent/listings/archived", "agent-listings-archived"],
  ["/dashboard/agent/listings/sold", "agent-listings-sold"],
  ["/dashboard/agent/offers", "agent-offers"],
  ["/dashboard/agent/leads", "agent-leads"],
  ["/dashboard/agent/crm", "agent-crm"],
  ["/dashboard/agent/viewings", "agent-viewings"],
  ["/dashboard/agent/viewings/feedback", "agent-viewings-feedback"],
  ["/dashboard/agent/sales", "agent-sales"],
  ["/dashboard/agent/sales/appraisal", "agent-sales-appraisal"],
  ["/dashboard/agent/sales/reports", "agent-sales-reports"],
  ["/dashboard/agent/analytics", "agent-analytics"],
  ["/dashboard/agent/analytics/branch", "agent-analytics-branch"],
  ["/dashboard/agent/analytics/competitors", "agent-analytics-competitors"],
  ["/dashboard/agent/reviews", "agent-reviews"],
  ["/dashboard/agent/profile", "agent-profile"],
  ["/dashboard/agent/profile/branding", "agent-profile-branding"],
  ["/dashboard/agent/team", "agent-team"],
  ["/dashboard/agent/team/branches", "agent-team-branches"],
  ["/dashboard/agent/team/roles", "agent-team-roles"],
  ["/dashboard/agent/revenue", "agent-revenue"],
  ["/dashboard/agent/integrations", "agent-integrations"],
  ["/dashboard/agent/integrations/feeds", "agent-integrations-feeds"],
  ["/dashboard/agent/billing", "agent-billing"],
  ["/dashboard/agent/billing/boost", "agent-billing-boost"],
] as const;

test.describe("Agent Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/agent.json",
  });

  for (const [path, name] of AGENT_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── PROVIDER DASHBOARD ──────────────────────────────────────────────────────

const PROVIDER_PAGES = [
  ["/dashboard/provider", "provider-dashboard"],
  ["/dashboard/provider/jobs/leads", "provider-jobs-leads"],
  ["/dashboard/provider/jobs/active", "provider-jobs-active"],
  ["/dashboard/provider/jobs/completed", "provider-jobs-completed"],
  ["/dashboard/provider/quotes", "provider-quotes"],
  ["/dashboard/provider/quotes/builder", "provider-quotes-builder"],
  ["/dashboard/provider/payments", "provider-payments"],
  ["/dashboard/provider/reviews", "provider-reviews"],
  ["/dashboard/provider/profile", "provider-profile"],
  ["/dashboard/provider/portfolio", "provider-portfolio"],
  ["/dashboard/provider/services", "provider-services"],
  ["/dashboard/provider/services/areas", "provider-services-areas"],
  ["/dashboard/provider/availability", "provider-availability"],
  ["/dashboard/provider/documents", "provider-documents"],
  ["/dashboard/provider/analytics", "provider-analytics"],
  ["/dashboard/provider/verification", "provider-verification"],
  ["/dashboard/provider/verification/credentials", "provider-verification-credentials"],
  ["/dashboard/provider/verification/client-references", "provider-verification-client-references"],
  ["/dashboard/provider/verification/peer-references", "provider-verification-peer-references"],
  ["/dashboard/provider/verification/badges", "provider-verification-badges"],
  ["/dashboard/provider/billing", "provider-billing"],
  ["/dashboard/provider/boost", "provider-boost"],
  ["/dashboard/provider/referrals", "provider-referrals"],
  ["/dashboard/provider/field", "provider-field"],
  ["/dashboard/provider/field/jobs", "provider-field-jobs"],
  ["/dashboard/provider/field/payments", "provider-field-payments"],
] as const;

test.describe("Provider Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/provider.json",
  });

  for (const [path, name] of PROVIDER_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

const ADMIN_PAGES = [
  ["/admin", "admin-dashboard"],
  ["/admin/users", "admin-users"],
  ["/admin/moderation", "admin-moderation"],
  ["/admin/verifications", "admin-verifications"],
  ["/admin/reviews", "admin-reviews"],
  ["/admin/reported", "admin-reported"],
  ["/admin/subscriptions", "admin-subscriptions"],
  ["/admin/feature-flags", "admin-feature-flags"],
  ["/admin/system-health", "admin-system-health"],
  ["/admin/audit-log", "admin-audit-log"],
  ["/admin/gdpr", "admin-gdpr"],
  ["/admin/fraud", "admin-fraud"],
  ["/admin/seo", "admin-seo"],
  ["/admin/email-campaigns", "admin-email-campaigns"],
  ["/admin/promo-codes", "admin-promo-codes"],
  ["/admin/roles", "admin-roles"],
  ["/admin/team", "admin-team"],
  ["/admin/api-usage", "admin-api-usage"],
  ["/admin/analytics/behaviour", "admin-analytics-behaviour"],
  ["/admin/analytics/platform", "admin-analytics-platform"],
  ["/admin/analytics/revenue", "admin-analytics-revenue"],
  ["/admin/analytics/search", "admin-analytics-search"],
  ["/admin/cms/blog", "admin-cms-blog"],
  ["/admin/cms/help", "admin-cms-help"],
  ["/admin/cms/landing", "admin-cms-landing"],
] as const;

test.describe("Admin Dashboard", () => {
  test.use({
    storageState: "e2e/.auth/admin.json",
  });

  for (const [path, name] of ADMIN_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});

// ─── SHARED PROTECTED PAGES ──────────────────────────────────────────────────

const SHARED_PROTECTED_PAGES = [
  ["/inbox", "shared-inbox"],
  ["/notifications", "shared-notifications"],
  ["/profile", "shared-profile"],
  ["/profile/settings", "shared-profile-settings"],
  ["/settings", "shared-settings"],
  ["/settings/account", "shared-settings-account"],
  ["/settings/security", "shared-settings-security"],
  ["/settings/privacy", "shared-settings-privacy"],
  ["/settings/notifications", "shared-settings-notifications"],
  ["/settings/email-subscriptions", "shared-settings-email-subscriptions"],
  ["/settings/preferences", "shared-settings-preferences"],
  ["/dashboard/bookings", "shared-bookings"],
  ["/dashboard/reviews", "shared-dashboard-reviews"],
  ["/dashboard/rfqs", "shared-rfqs"],
  ["/dashboard/rfqs/create", "shared-rfqs-create"],
] as const;

test.describe("Shared Protected Pages", () => {
  test.use({
    storageState: "e2e/.auth/homebuyer.json",
  });

  for (const [path, name] of SHARED_PROTECTED_PAGES) {
    test(`renders ${name}`, async ({ page }) => {
      await checkPage(page, `http://localhost:3000${path}`, name);
    });
  }
});
