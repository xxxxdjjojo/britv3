/**
 * Profile validation schemas -- client-safe (no server-only imports).
 * Extracted from profile-service.ts to avoid pulling sharp into client bundles.
 */

import { z } from "zod";

/** UK phone regex: +44, 07, or 0 followed by digits/spaces */
const UK_PHONE_REGEX = /^(?:\+44|0)[\d\s]{9,13}$/;

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters"),
  phone: z
    .string()
    .regex(UK_PHONE_REGEX, "Must be a valid UK phone number")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

const serviceItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1).max(500),
});

export const providerProfileSchema = z.object({
  services: z.array(serviceItemSchema).min(1, "At least one service required"),
  coverage_postcodes: z.array(z.string().min(2).max(10)).min(1, "At least one postcode required"),
  pricing: z.record(z.string(), z.number().min(0)),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
