/**
 * Application constants -- role definitions, verification levels,
 * consent types, route lists, and verification stages.
 */

import type { UserRole, VerificationLevel, VerificationStage } from "@/types/auth";
import type { ConsentType } from "@/types/gdpr";

// -- Roles ------------------------------------------------------------------

export type RoleDefinition = Readonly<{
  value: UserRole;
  label: string;
  description: string;
  icon: string;
}>;

export const ROLES: readonly RoleDefinition[] = [
  {
    value: "homebuyer",
    label: "Homebuyer",
    description: "Search and purchase residential properties",
    icon: "Home",
  },
  {
    value: "renter",
    label: "Renter",
    description: "Find rental properties and manage tenancies",
    icon: "Key",
  },
  {
    value: "seller",
    label: "Seller",
    description: "List and sell your properties",
    icon: "Tag",
  },
  {
    value: "landlord",
    label: "Landlord",
    description: "Manage rental properties and tenants",
    icon: "Building",
  },
  {
    value: "agent",
    label: "Estate Agent",
    description: "List properties and manage client relationships",
    icon: "Briefcase",
  },
  {
    value: "service_provider",
    label: "Service Provider",
    description: "Offer property services such as conveyancing, surveys, and removals",
    icon: "Wrench",
  },
  {
    value: "mortgage_broker",
    label: "Mortgage Broker",
    description: "Help clients find the right mortgage",
    icon: "Landmark",
  },
] as const;

/** Professional roles shown on "I am a professional" path */
export const PROFESSIONAL_ROLES: readonly RoleDefinition[] = ROLES.filter(
  (r) =>
    r.value === "landlord" ||
    r.value === "agent" ||
    r.value === "service_provider" ||
    r.value === "mortgage_broker",
);

// -- Verification Levels ----------------------------------------------------

export type VerificationLevelDefinition = Readonly<{
  value: VerificationLevel;
  label: string;
  requiredStages: readonly VerificationStage[];
  unlocks: string;
}>;

export const VERIFICATION_LEVELS: readonly VerificationLevelDefinition[] = [
  {
    value: "basic",
    label: "Basic",
    requiredStages: ["email"],
    unlocks: "Browse listings, save searches, contact agents",
  },
  {
    value: "standard",
    label: "Standard",
    requiredStages: ["email", "phone"],
    unlocks: "Make offers, book viewings, leave reviews",
  },
  {
    value: "enhanced",
    label: "Enhanced",
    requiredStages: ["email", "phone", "identity"],
    unlocks: "List properties, access transaction tools",
  },
  {
    value: "professional",
    label: "Professional",
    requiredStages: ["email", "phone", "identity", "insurance", "qualifications", "admin_review"],
    unlocks: "Full marketplace access, verified provider badge",
  },
] as const;

// -- Verification Stages ----------------------------------------------------

export type VerificationStageDefinition = Readonly<{
  value: VerificationStage;
  label: string;
  description: string;
  order: number;
}>;

export const VERIFICATION_STAGES: readonly VerificationStageDefinition[] = [
  {
    value: "email",
    label: "Email Verification",
    description: "Confirm your email address",
    order: 1,
  },
  {
    value: "phone",
    label: "Phone Verification",
    description: "Verify your phone number via SMS",
    order: 2,
  },
  {
    value: "identity",
    label: "Identity Check",
    description: "Upload government-issued photo ID",
    order: 3,
  },
  {
    value: "insurance",
    label: "Insurance Verification",
    description: "Provide proof of professional indemnity insurance",
    order: 4,
  },
  {
    value: "qualifications",
    label: "Qualifications",
    description: "Upload professional certifications and accreditations",
    order: 5,
  },
  {
    value: "admin_review",
    label: "Admin Review",
    description: "Final review by the Britestate team",
    order: 6,
  },
] as const;

// -- Consent Types ----------------------------------------------------------

export type ConsentTypeDefinition = Readonly<{
  value: ConsentType;
  label: string;
  description: string;
  required: boolean;
}>;

export const CONSENT_TYPES: readonly ConsentTypeDefinition[] = [
  {
    value: "marketing",
    label: "Marketing Communications",
    description: "Receive property alerts, newsletters, and promotional offers via email",
    required: false,
  },
  {
    value: "analytics",
    label: "Analytics & Personalisation",
    description: "Allow us to analyse your usage to improve search results and recommendations",
    required: false,
  },
  {
    value: "third_party",
    label: "Third-Party Sharing",
    description: "Share your data with trusted partners such as mortgage brokers and solicitors",
    required: false,
  },
] as const;

// -- Route Lists (for middleware) -------------------------------------------

/** Routes that require no authentication */
export const PUBLIC_ROUTES: readonly string[] = [
  "/",
  "/about",
  "/terms",
  "/privacy",
  "/overview",
  "/search",
  "/properties",
  "/marketplace",
  "/help",
  "/verify-email",
  "/verify-email/confirmed",
  "/register/role-select",
  "/register/onboarding",
] as const;

/** Routes for unauthenticated users only (login, register, etc.) */
export const AUTH_ROUTES: readonly string[] = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/** Route prefixes that require authentication */
export const PROTECTED_ROUTES: readonly string[] = [
  "/dashboard",
  "/settings",
  "/inbox",
  "/notifications",
  "/profile",
  "/milestones",
] as const;
