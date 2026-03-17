/**
 * Stripe singleton — shared across all server-side billing code.
 *
 * Import this instead of creating Stripe instances locally:
 *   import { getStripe } from "@/lib/stripe";
 */
import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  _stripe = new Stripe(key);
  return _stripe;
}
