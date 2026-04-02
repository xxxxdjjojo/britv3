/**
 * Seed Demo — Reviews
 *
 * Creates 15 reviews of Mike Johnson (the only service provider in demo data).
 * The reviews table requires booking_id (unique FK to bookings) and provider_id
 * (FK to service_provider_details). We use the 7 existing completed bookings from
 * provider.ts and create 8 additional completed bookings to support 15 total reviews.
 *
 * Rating distribution: 40% five-star (6), 35% four (5), 15% three (2), 10% two (2)
 *
 * NOTE: The reviews_update_rating_stats trigger auto-updates provider_rating_stats.
 *
 * UUID prefix: l9000000
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USERS, type Scenario } from "./config";
import { daysAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIKE = DEMO_USERS.PROVIDER;
const ROBERT = DEMO_USERS.LANDLORD;
const SARAH = DEMO_USERS.HOMEBUYER;
const EMMA = DEMO_USERS.SELLER;
const JAMES = DEMO_USERS.RENTER;

// Existing completed booking IDs from provider.ts
const EXISTING_BOOKING_IDS = [
  "g6000000-0301-4000-8000-000000000001", // Landlord - tap repair
  "g6000000-0302-4000-8000-000000000002", // Landlord - boiler service
  "g6000000-0303-4000-8000-000000000003", // Landlord - burst pipe
  "g6000000-0304-4000-8000-000000000004", // Homebuyer - boiler repair
  "g6000000-0305-4000-8000-000000000005", // Landlord - radiator bleed
  "g6000000-0306-4000-8000-000000000006", // Seller - unblock drain
  "g6000000-0307-4000-8000-000000000007", // Landlord - stopcock replacement
] as const;

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (l9000000 prefix)
// ---------------------------------------------------------------------------

/** Additional booking IDs for extra reviews */
function extraBookingId(n: number): string {
  return `l9000000-01${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

/** Review IDs */
function reviewId(n: number): string {
  return `l9000000-02${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// ---------------------------------------------------------------------------
// Additional Bookings (to support 15 total reviews)
// ---------------------------------------------------------------------------

function buildAdditionalBookings(): Record<string, unknown>[] {
  return [
    // 8 additional completed bookings for various users
    {
      id: extraBookingId(1),
      service_request_id: null,
      quote_id: null,
      user_id: SARAH.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(120).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(120).toISOString().split("T")[0],
      actual_start_date: daysAgo(120).toISOString().split("T")[0],
      actual_end_date: daysAgo(120).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(122).toISOString(),
    },
    {
      id: extraBookingId(2),
      service_request_id: null,
      quote_id: null,
      user_id: SARAH.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(135).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(135).toISOString().split("T")[0],
      actual_start_date: daysAgo(135).toISOString().split("T")[0],
      actual_end_date: daysAgo(135).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(137).toISOString(),
    },
    {
      id: extraBookingId(3),
      service_request_id: null,
      quote_id: null,
      user_id: EMMA.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(145).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(145).toISOString().split("T")[0],
      actual_start_date: daysAgo(145).toISOString().split("T")[0],
      actual_end_date: daysAgo(145).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(147).toISOString(),
    },
    {
      id: extraBookingId(4),
      service_request_id: null,
      quote_id: null,
      user_id: JAMES.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(155).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(155).toISOString().split("T")[0],
      actual_start_date: daysAgo(155).toISOString().split("T")[0],
      actual_end_date: daysAgo(155).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(157).toISOString(),
    },
    {
      id: extraBookingId(5),
      service_request_id: null,
      quote_id: null,
      user_id: JAMES.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(170).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(170).toISOString().split("T")[0],
      actual_start_date: daysAgo(170).toISOString().split("T")[0],
      actual_end_date: daysAgo(170).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(172).toISOString(),
    },
    {
      id: extraBookingId(6),
      service_request_id: null,
      quote_id: null,
      user_id: ROBERT.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(180).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(180).toISOString().split("T")[0],
      actual_start_date: daysAgo(180).toISOString().split("T")[0],
      actual_end_date: daysAgo(180).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(182).toISOString(),
    },
    {
      id: extraBookingId(7),
      service_request_id: null,
      quote_id: null,
      user_id: ROBERT.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(200).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(200).toISOString().split("T")[0],
      actual_start_date: daysAgo(200).toISOString().split("T")[0],
      actual_end_date: daysAgo(200).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(202).toISOString(),
    },
    {
      id: extraBookingId(8),
      service_request_id: null,
      quote_id: null,
      user_id: EMMA.id,
      provider_id: MIKE.id,
      scheduled_start_date: daysAgo(210).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(210).toISOString().split("T")[0],
      actual_start_date: daysAgo(210).toISOString().split("T")[0],
      actual_end_date: daysAgo(210).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(212).toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Review Data
// ---------------------------------------------------------------------------

interface ReviewDef {
  bookingId: string;
  reviewerId: string;
  overall: number;
  punctuality: number;
  quality: number;
  value: number;
  professionalism: number;
  title: string;
  text: string;
  sentiment: string;
  daysAgo: number;
  providerResponse?: string;
}

function buildReviewDefs(): ReviewDef[] {
  return [
    // --- 5-star reviews (6 total, 40%) ---
    {
      bookingId: EXISTING_BOOKING_IDS[0],
      reviewerId: ROBERT.id,
      overall: 5, punctuality: 5, quality: 5, value: 5, professionalism: 5,
      title: "Excellent tap repair — quick and professional",
      text: "Mike arrived on time, diagnosed the issue within minutes, and had the new tap fitted in under an hour. Very tidy worker, cleaned up after himself. Highly recommended for any plumbing work.",
      sentiment: "very_positive",
      daysAgo: 22,
      providerResponse: "Thank you Robert, always happy to help with your rental properties!",
    },
    {
      bookingId: EXISTING_BOOKING_IDS[3],
      reviewerId: SARAH.id,
      overall: 5, punctuality: 5, quality: 5, value: 4, professionalism: 5,
      title: "Saved us on a cold day — boiler fixed perfectly",
      text: "Our boiler broke down on the coldest week of the year. Mike came out the next morning and had it running again by lunchtime. He explained what was wrong clearly and the price was fair for the work done.",
      sentiment: "very_positive",
      daysAgo: 48,
    },
    {
      bookingId: EXISTING_BOOKING_IDS[2],
      reviewerId: ROBERT.id,
      overall: 5, punctuality: 5, quality: 5, value: 5, professionalism: 5,
      title: "Emergency burst pipe handled brilliantly",
      text: "Called Mike on a Sunday morning about a burst pipe in one of my rental properties. He was there within 2 hours, stopped the leak, and had the pipe replaced by that evening. Absolute lifesaver. His emergency rate is very reasonable too.",
      sentiment: "very_positive",
      daysAgo: 58,
      providerResponse: "Thanks Robert — burst pipes can't wait, glad I could get there quickly.",
    },
    {
      bookingId: extraBookingId(1),
      reviewerId: SARAH.id,
      overall: 5, punctuality: 5, quality: 5, value: 5, professionalism: 5,
      title: "Brilliant radiator installation",
      text: "Mike installed two new radiators in our hallway and bedroom. Beautifully neat pipework, minimal disruption, and he even helped us choose the right size radiators for each room. Would use again without hesitation.",
      sentiment: "very_positive",
      daysAgo: 118,
    },
    {
      bookingId: extraBookingId(6),
      reviewerId: ROBERT.id,
      overall: 5, punctuality: 4, quality: 5, value: 5, professionalism: 5,
      title: "Thorough boiler service as always",
      text: "Mike does the annual boiler service on all my rental properties. Always thorough, provides a detailed report, and flags anything that might become a problem. Arrived slightly late this time due to traffic but made up for it with excellent work.",
      sentiment: "very_positive",
      daysAgo: 178,
    },
    {
      bookingId: extraBookingId(8),
      reviewerId: EMMA.id,
      overall: 5, punctuality: 5, quality: 5, value: 4, professionalism: 5,
      title: "Perfect bathroom tap replacement",
      text: "Needed both bathroom taps replaced before selling our house. Mike sourced quality taps at a good price and fitted them perfectly. Everything looks brand new. He was in and out in a couple of hours.",
      sentiment: "very_positive",
      daysAgo: 208,
    },

    // --- 4-star reviews (5 total, 35%) ---
    {
      bookingId: EXISTING_BOOKING_IDS[1],
      reviewerId: ROBERT.id,
      overall: 4, punctuality: 4, quality: 4, value: 4, professionalism: 4,
      title: "Good boiler service, reliable as always",
      text: "Annual boiler service completed without any issues. Mike is always professional and explains things well. Slightly more expensive than last year but still competitive for the area. Would continue to use.",
      sentiment: "positive",
      daysAgo: 36,
    },
    {
      bookingId: EXISTING_BOOKING_IDS[4],
      reviewerId: ROBERT.id,
      overall: 4, punctuality: 5, quality: 4, value: 4, professionalism: 4,
      title: "Radiator bleed and balance done well",
      text: "Mike came to bleed and balance all the radiators across my properties. Good job overall — most rooms are heating evenly now. One radiator still has a slight cold spot but Mike says it may need replacing as its quite old.",
      sentiment: "positive",
      daysAgo: 73,
    },
    {
      bookingId: extraBookingId(2),
      reviewerId: SARAH.id,
      overall: 4, punctuality: 3, quality: 5, value: 4, professionalism: 4,
      title: "Great work but arrived late",
      text: "Mike did an excellent job replacing our kitchen waste pipe. The quality of work is always high with him. Only gripe is he arrived about 45 minutes late without calling ahead. Once he was here though, the work was done quickly and to a high standard.",
      sentiment: "positive",
      daysAgo: 133,
    },
    {
      bookingId: extraBookingId(4),
      reviewerId: JAMES.id,
      overall: 4, punctuality: 4, quality: 4, value: 3, professionalism: 5,
      title: "Fixed the shower — a bit pricey though",
      text: "The shower thermostat was playing up and Mike diagnosed and replaced it within an hour. Very professional, explained everything as he went. The parts markup seemed a bit high compared to what I found online, but the labour charge was fair and it works perfectly now.",
      sentiment: "positive",
      daysAgo: 153,
    },
    {
      bookingId: extraBookingId(7),
      reviewerId: ROBERT.id,
      overall: 4, punctuality: 4, quality: 5, value: 4, professionalism: 4,
      title: "Solid stopcock replacement",
      text: "Needed the main stopcock replaced at one of my rental flats. Mike handled the water isolation carefully and fitted a new quarter-turn valve. Neat job, though it took a bit longer than expected. The new valve works perfectly.",
      sentiment: "positive",
      daysAgo: 198,
    },

    // --- 3-star reviews (2 total, 15%) ---
    {
      bookingId: EXISTING_BOOKING_IDS[5],
      reviewerId: EMMA.id,
      overall: 3, punctuality: 2, quality: 4, value: 3, professionalism: 3,
      title: "Job done but communication could improve",
      text: "Mike unblocked our drain which had been causing problems for weeks. The work itself was fine — drain is flowing properly now. However, he was an hour late, didn't give an update, and the final price was higher than the initial estimate. The quality of the actual plumbing work is good though.",
      sentiment: "neutral",
      daysAgo: 88,
    },
    {
      bookingId: extraBookingId(3),
      reviewerId: EMMA.id,
      overall: 3, punctuality: 3, quality: 3, value: 3, professionalism: 4,
      title: "Adequate but needed a follow-up visit",
      text: "Mike replaced a section of pipework under the kitchen sink. The initial repair developed a slight drip after a few days, so he had to come back to redo the joint. He came back promptly and fixed it at no extra charge, which was appreciated. End result is fine.",
      sentiment: "neutral",
      daysAgo: 143,
      providerResponse: "Sorry about the return visit Emma — the joint was in an awkward spot. Glad we got it sorted properly in the end.",
    },

    // --- 2-star reviews (2 total, 10%) ---
    {
      bookingId: extraBookingId(5),
      reviewerId: JAMES.id,
      overall: 2, punctuality: 2, quality: 3, value: 2, professionalism: 2,
      title: "Overcharged for a simple job",
      text: "Called Mike to fix a dripping tap. He was late by over an hour and charged £180 for what ended up being a washer replacement — a 15-minute job. I felt the charge was excessive for the work done. The tap no longer drips, so the actual repair was fine, but I expected better value.",
      sentiment: "negative",
      daysAgo: 168,
      providerResponse: "I understand the frustration, James. The charge included the call-out fee and minimum hour rate, which I explained when you booked. I'm always transparent about pricing upfront.",
    },
    {
      bookingId: EXISTING_BOOKING_IDS[6],
      reviewerId: ROBERT.id,
      overall: 2, punctuality: 1, quality: 3, value: 2, professionalism: 2,
      title: "No-show first time, eventually got it done",
      text: "Mike didnt turn up for the originally scheduled appointment and only called to reschedule 2 hours after he was supposed to arrive. When he did come back the following week, the stopcock replacement was done competently. But the lack of communication on the first appointment was really poor.",
      sentiment: "negative",
      daysAgo: 108,
      providerResponse: "Apologies Robert — I had a family emergency that day. I should have called earlier. The rescheduled work went smoothly and I hope the new stopcock is working well.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildReviewRows(): Record<string, unknown>[] {
  const defs = buildReviewDefs();
  return defs.map((r, i) => {
    const row: Record<string, unknown> = {
      id: reviewId(i + 1),
      booking_id: r.bookingId,
      provider_id: MIKE.id,
      reviewer_id: r.reviewerId,
      overall_rating: r.overall,
      punctuality_rating: r.punctuality,
      quality_rating: r.quality,
      value_rating: r.value,
      professionalism_rating: r.professionalism,
      title: r.title,
      review_text: r.text,
      sentiment: r.sentiment,
      authenticity_score: 95 + Math.random() * 5, // 95-100
      fake_review_probability: Math.random() * 3, // 0-3%
      spam_indicators: JSON.stringify({}),
      moderation_status: "approved",
      helpful_count: Math.floor(Math.random() * 15),
      not_helpful_count: Math.floor(Math.random() * 3),
      created_at: daysAgo(r.daysAgo).toISOString(),
      updated_at: daysAgo(r.daysAgo).toISOString(),
    };

    if (r.providerResponse) {
      row.provider_response = r.providerResponse;
      row.provider_response_at = daysAgo(r.daysAgo - 1).toISOString();
    }

    return row;
  });
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function seedReviews(
  supabase: SupabaseClient,
  _scenario: Scenario,
): Promise<void> {
  console.log("\n--- Seeding Reviews ---");

  // 1. Seed additional bookings needed for extra reviews
  const additionalBookings = buildAdditionalBookings();
  await seedTable(supabase, "bookings", additionalBookings);

  // 2. Seed reviews (trigger will auto-update provider_rating_stats)
  const reviewRows = buildReviewRows();
  await seedTable(supabase, "reviews", reviewRows);
}
