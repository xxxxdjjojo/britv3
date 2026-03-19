/**
 * Zod schemas for validating LLM output.
 * Each schema corresponds to a specific AI feature's expected response shape.
 */

import { z } from "zod";

export const QuoteDraftSchema = z.object({
  line_items: z.array(z.object({
    description: z.string().min(1).max(500),
    amount: z.number().positive(),
  })).min(1).max(50),
  total: z.number().positive(),
  estimated_duration: z.string().min(1).max(200),
  scope_of_work: z.string().min(1).max(2000),
});
export type QuoteDraftParsed = z.infer<typeof QuoteDraftSchema>;

export const AgentProposalSchema = z.object({
  valuation_range: z.object({
    low: z.number().positive(),
    high: z.number().positive(),
  }),
  comparable_properties: z.array(z.object({
    address: z.string().min(1).max(300),
    price: z.number().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).min(0).max(20),
  marketing_strategy: z.string().min(1).max(2000),
  fee_structure: z.string().min(1).max(1000),
});
export type AgentProposalParsed = z.infer<typeof AgentProposalSchema>;
