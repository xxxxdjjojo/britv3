/**
 * Marketplace Zod validation schemas for all user-facing form inputs.
 * Each schema exports a corresponding Input type via z.infer.
 */

import { z } from "zod";

// -- Constants ---------------------------------------------------------------

const SERVICE_CATEGORIES = [
  "conveyancing",
  "surveying",
  "mortgage_broker",
  "moving_company",
  "home_inspector",
  "cleaning",
  "handyman",
  "plumber",
  "electrician",
  "landscaping",
  "interior_design",
  "architect",
  "property_management",
  "pest_control",
  "locksmith",
  "other",
] as const;

const VERIFICATION_DOCUMENT_TYPES = [
  "identity_proof",
  "qualification_certificate",
  "insurance_certificate",
  "business_registration",
  "dbs_check",
  "reference_letter",
] as const;

const REVIEW_FLAG_REASONS = [
  "spam",
  "inappropriate",
  "fake",
  "off_topic",
  "contact_info",
  "promotional",
  "duplicate",
] as const;

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;

// -- Schemas -----------------------------------------------------------------

/** Provider profile creation/update form */
export const providerProfileSchema = z.object({
  business_name: z
    .string()
    .min(3, "Business name must be at least 3 characters")
    .max(100, "Business name must be at most 100 characters"),
  business_description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be at most 2000 characters"),
  trading_name: z.string().max(100).optional(),
  company_number: z.string().max(20).optional(),
  vat_number: z.string().max(20).optional(),
  services: z
    .array(z.enum(SERVICE_CATEGORIES))
    .min(1, "Select at least one service category"),
  service_postcodes: z.array(z.string()).default([]),
  service_radius: z
    .number()
    .min(1, "Minimum radius is 1 mile")
    .max(100, "Maximum radius is 100 miles")
    .default(25),
  pricing: z
    .object({
      call_out_fee: z.number().min(0).optional(),
      hourly_rate: z.number().min(0).optional(),
      day_rate: z.number().min(0).optional(),
    })
    .optional(),
  website_url: z.string().url().optional().or(z.literal("")),
  years_in_business: z.number().int().min(0).default(0),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

/** Document upload form */
export const documentUploadSchema = z.object({
  document_type: z.enum(VERIFICATION_DOCUMENT_TYPES),
  expiry_date: z.coerce.date().optional(),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

/** RFQ (service request) creation form */
export const rfqCreateSchema = z.object({
  service_category: z.enum(SERVICE_CATEGORIES),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be at most 5000 characters"),
  property_address: z.string().optional(),
  property_postcode: z
    .string()
    .regex(UK_POSTCODE_REGEX, "Enter a valid UK postcode"),
  preferred_start_date: z.coerce.date().optional(),
  urgency_level: z
    .enum(["low", "normal", "high", "emergency"])
    .default("normal"),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
});

export type RfqCreateInput = z.infer<typeof rfqCreateSchema>;

/** Quote creation form (provider submitting a quote) */
export const quoteCreateSchema = z.object({
  line_items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit_price: z.number().min(0, "Unit price must be non-negative"),
        total: z.number().min(0, "Total must be non-negative"),
      }),
    )
    .min(1, "At least one line item is required"),
  scope_of_work: z
    .string()
    .min(50, "Scope must be at least 50 characters")
    .max(5000, "Scope must be at most 5000 characters"),
  estimated_duration: z.string().optional(),
  payment_terms: z.string().optional(),
  warranty_info: z.string().optional(),
  validity_date: z.coerce.date(),
  vat_included: z.boolean().default(false),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;

/** Booking creation form (user booking from accepted quote) */
export const bookingCreateSchema = z
  .object({
    quote_id: z.string().uuid("Invalid quote ID"),
    scheduled_start_date: z.coerce.date(),
    scheduled_end_date: z.coerce.date(),
  })
  .refine((data) => data.scheduled_end_date >= data.scheduled_start_date, {
    message: "End date must be on or after start date",
    path: ["scheduled_end_date"],
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

/** Review submission form */
export const reviewCreateSchema = z.object({
  overall_rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  punctuality_rating: z.number().int().min(1).max(5).optional(),
  quality_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  professionalism_rating: z.number().int().min(1).max(5).optional(),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),
  review_text: z
    .string()
    .min(20, "Review must be at least 20 characters")
    .max(2000, "Review must be at most 2000 characters"),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

/** Review edit form (within 48h window) */
export const reviewEditSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be under 100 characters"),
  review_text: z.string().min(20, "Review must be at least 20 characters").max(2000, "Review must be under 2000 characters"),
  overall_rating: z.number().int().min(1).max(5),
  punctuality_rating: z.number().int().min(1).max(5).optional(),
  quality_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  professionalism_rating: z.number().int().min(1).max(5).optional(),
});

export type ReviewEditInput = z.infer<typeof reviewEditSchema>;

/** Provider search form */
export const providerSearchSchema = z.object({
  service_category: z.enum(SERVICE_CATEGORIES).optional(),
  postcode: z
    .string()
    .regex(UK_POSTCODE_REGEX, "Enter a valid UK postcode")
    .optional()
    .or(z.literal("")),
  radius: z.number().min(1).max(100).default(25),
  min_rating: z.number().min(1).max(5).optional(),
  search_query: z.string().optional(),
});

export type ProviderSearchInput = z.infer<typeof providerSearchSchema>;

/** Review flag form */
export const reviewFlagSchema = z.object({
  reason: z.enum(REVIEW_FLAG_REASONS),
  description: z.string().max(500).optional(),
});

export type ReviewFlagInput = z.infer<typeof reviewFlagSchema>;

/** Provider availability form */
export const providerAvailabilitySchema = z
  .object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    reason: z.string().max(500).optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export type ProviderAvailabilityInput = z.infer<
  typeof providerAvailabilitySchema
>;
