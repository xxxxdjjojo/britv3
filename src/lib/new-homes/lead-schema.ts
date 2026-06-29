import { z } from "zod";

// Shared validation for every New Homes lead-capture surface (register
// interest, book viewing, request brochure, ask a question). The API route and
// the client forms both parse against this so validation can never drift.

export const leadTypeSchema = z.enum([
  "register_interest",
  "book_viewing",
  "request_brochure",
  "ask_question",
]);

export const buyerStatusSchema = z.enum([
  "first_time_buyer",
  "home_mover",
  "investor",
  "relocating",
  "other",
]);

export const mortgagePositionSchema = z.enum([
  "cash_buyer",
  "agreement_in_principle",
  "applied",
  "not_started",
  "help_to_buy",
]);

export const developmentLeadSchema = z.object({
  developmentId: z.string().uuid("A valid development is required"),
  unitId: z.string().uuid().optional().nullable(),
  leadType: leadTypeSchema,

  name: z.string().min(2, "Please enter your full name").max(120),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(7, "Please enter a valid phone number")
    .max(30)
    .optional()
    .or(z.literal("")),

  buyerStatus: buyerStatusSchema.optional(),
  budget: z.coerce.number().int().positive().max(50_000_000).optional(),
  desiredMoveDate: z.string().max(60).optional().or(z.literal("")),
  mortgagePosition: mortgagePositionSchema.optional(),
  hasPropertyToSell: z.boolean().optional(),
  preferredPlot: z.string().max(60).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),

  // Requested viewing slot (only meaningful for book_viewing).
  preferredViewingAt: z.string().max(60).optional().or(z.literal("")),

  // Attribution (filled in by the form from the current URL).
  sourceRoute: z.string().max(300).optional(),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
      term: z.string().max(120).optional(),
      content: z.string().max(120).optional(),
    })
    .optional(),
});

export type DevelopmentLeadInput = z.infer<typeof developmentLeadSchema>;
