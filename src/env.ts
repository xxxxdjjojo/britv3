import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    // Destination for production alert emails (alert-engine-tick). Optional:
    // when unset, the engine records alert_events but skips email delivery.
    OPS_ALERT_EMAIL: z.string().email().optional(),
    // Required in production so a misconfigured deploy cannot expose the
    // Inngest endpoint without signature verification (BRIT-S010). Optional in
    // dev/test where Inngest runs in dev mode and signs nothing.
    INNGEST_SIGNING_KEY:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    // Companies House (gov.uk) — set ="disabled" to bypass the verification gate
    COMPANIES_HOUSE_API_KEY: z.string().min(1).optional(),
    // Tenant referencing / credit checks (pluggable provider; "mock" = no live vendor)
    REFERENCING_PROVIDER: z.enum(["mock", "goodlord", "homelet"]).default("mock"),
    REFERENCING_API_KEY: z.string().min(1).optional(),
    REFERENCING_WEBHOOK_SECRET: z.string().min(1).optional(),
    // ID verification / KYC (scaffolded; "stub" = no live vendor)
    KYC_PROVIDER: z.enum(["stub", "stripe", "didit"]).default("stub"),
    KYC_API_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OPS_ALERT_EMAIL: process.env.OPS_ALERT_EMAIL,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    COMPANIES_HOUSE_API_KEY: process.env.COMPANIES_HOUSE_API_KEY,
    REFERENCING_PROVIDER: process.env.REFERENCING_PROVIDER,
    REFERENCING_API_KEY: process.env.REFERENCING_API_KEY,
    REFERENCING_WEBHOOK_SECRET: process.env.REFERENCING_WEBHOOK_SECRET,
    KYC_PROVIDER: process.env.KYC_PROVIDER,
    KYC_API_KEY: process.env.KYC_API_KEY,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
