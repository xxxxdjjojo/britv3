/**
 * Seed Demo — Messaging (Conversations & Messages)
 *
 * Creates 8 conversations between connected demo users with
 * 4-8 realistic messages each. Total: 40+ messages.
 *
 * UUID prefix: b8000000
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USERS, type Scenario } from "./config";
import { DEMO_LISTING_IDS, } from "./properties";
import { minutesAgo, hoursAgo, daysAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SARAH = DEMO_USERS.HOMEBUYER;
const JAMES = DEMO_USERS.RENTER;
const EMMA = DEMO_USERS.SELLER;
const ROBERT = DEMO_USERS.LANDLORD;
const VICTORIA = DEMO_USERS.AGENT;
const MIKE = DEMO_USERS.PROVIDER;

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (b8000000 prefix)
// ---------------------------------------------------------------------------

/** Conversation IDs: b8000000-01NN */
function convId(n: number): string {
  return `b8000000-01${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

/** Message IDs: b8000000-02NN */
function msgId(n: number): string {
  return `b8000000-02${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// Property IDs referenced in conversations
const BATTERSEA_LISTING = DEMO_LISTING_IDS["b1000001-0001-4000-8000-000000000001"];
const ISLINGTON_LISTING = DEMO_LISTING_IDS["b1000001-0002-4000-8000-000000000002"];
const HYDE_PARK_LISTING = DEMO_LISTING_IDS["b1000001-0008-4000-8000-000000000008"];

// ---------------------------------------------------------------------------
// Conversation Definitions
// ---------------------------------------------------------------------------

interface ConversationDef {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  context_type: "listing" | "booking" | "rfq" | "general";
  context_id: string | null;
  messages: Array<{
    id: string;
    sender_id: string;
    content: string;
    minutesAgo: number;
  }>;
}

function buildConversations(): ConversationDef[] {
  return [
    // 1. Sarah (buyer) <-> Victoria (agent): property enquiry about Battersea
    {
      id: convId(1),
      participant_1_id: SARAH.id,
      participant_2_id: VICTORIA.id,
      context_type: "listing",
      context_id: BATTERSEA_LISTING,
      messages: [
        { id: msgId(1), sender_id: SARAH.id, content: "Hi Victoria, I saw the listing for 14 Rosemary Lane in Battersea. Is it still available for viewings?", minutesAgo: 185 },
        { id: msgId(2), sender_id: VICTORIA.id, content: "Hello Sarah! Yes, it's still available. We have slots this Thursday afternoon or Saturday morning. Which works better for you?", minutesAgo: 172 },
        { id: msgId(3), sender_id: SARAH.id, content: "Saturday morning would be perfect. Around 10am if possible?", minutesAgo: 168 },
        { id: msgId(4), sender_id: VICTORIA.id, content: "10am Saturday is confirmed. I'll send you the details. Just to mention, there's been quite a bit of interest in this one so I'd recommend coming prepared if you're serious.", minutesAgo: 155 },
        { id: msgId(5), sender_id: SARAH.id, content: "That's helpful to know, thank you. Can you tell me if the seller would consider offers below the asking price?", minutesAgo: 140 },
        { id: msgId(6), sender_id: VICTORIA.id, content: "The seller is realistic but given the level of interest, I'd suggest any offer should be close to asking. Happy to discuss more after the viewing!", minutesAgo: 3 },
      ],
    },

    // 2. James (renter) <-> Robert (landlord): maintenance question
    {
      id: convId(2),
      participant_1_id: JAMES.id,
      participant_2_id: ROBERT.id,
      context_type: "listing",
      context_id: HYDE_PARK_LISTING,
      messages: [
        { id: msgId(7), sender_id: JAMES.id, content: "Hi Robert, the boiler in the flat has been making a strange banging noise when the heating kicks in. It started yesterday evening.", minutesAgo: 360 },
        { id: msgId(8), sender_id: ROBERT.id, content: "Thanks for letting me know, James. That sounds like it could be kettling or trapped air. Is the heating still working properly?", minutesAgo: 340 },
        { id: msgId(9), sender_id: JAMES.id, content: "Yes, it's still heating fine, just the noise is quite loud. It happens every time the thermostat triggers.", minutesAgo: 320 },
        { id: msgId(10), sender_id: ROBERT.id, content: "OK, I'll get my plumber Mike to come have a look. He's usually available within a day or two. I'll let you know when he can come round.", minutesAgo: 305 },
        { id: msgId(11), sender_id: JAMES.id, content: "That would be great, thanks. I'm working from home most days so fairly flexible on times.", minutesAgo: 290 },
        { id: msgId(12), sender_id: ROBERT.id, content: "Mike can come Thursday between 2-4pm. Does that work for you?", minutesAgo: 45 },
        { id: msgId(13), sender_id: JAMES.id, content: "Perfect, Thursday afternoon works. I'll make sure I'm in.", minutesAgo: 38 },
      ],
    },

    // 3. Emma (seller) <-> Victoria (agent): sale progress update
    {
      id: convId(3),
      participant_1_id: EMMA.id,
      participant_2_id: VICTORIA.id,
      context_type: "listing",
      context_id: ISLINGTON_LISTING,
      messages: [
        { id: msgId(14), sender_id: VICTORIA.id, content: "Hi Emma, just a quick update on the Islington flat. We've had 12 viewings so far and two parties have expressed serious interest.", minutesAgo: 1440 },
        { id: msgId(15), sender_id: EMMA.id, content: "That's encouraging! Any indication of what they might offer?", minutesAgo: 1420 },
        { id: msgId(16), sender_id: VICTORIA.id, content: "One party is a first-time buyer with a mortgage in principle for the full amount. The other is a cash buyer looking to invest. I expect at least one offer by end of week.", minutesAgo: 1400 },
        { id: msgId(17), sender_id: EMMA.id, content: "Wonderful. I'd prefer the cash buyer for speed if the offer is close to asking. How long do you think to exchange?", minutesAgo: 1380 },
        { id: msgId(18), sender_id: VICTORIA.id, content: "With a cash buyer and no chain, we could potentially exchange in 6-8 weeks. I'll push for best and final offers once we have both on the table.", minutesAgo: 8 },
      ],
    },

    // 4. Robert (landlord) <-> Mike (provider): plumbing quote
    {
      id: convId(4),
      participant_1_id: ROBERT.id,
      participant_2_id: MIKE.id,
      context_type: "rfq",
      context_id: null,
      messages: [
        { id: msgId(19), sender_id: ROBERT.id, content: "Hi Mike, I've got another job for you if you're free. The tenant at the Hyde Park flat reports the boiler is making banging noises. Sounds like it might need a service.", minutesAgo: 720 },
        { id: msgId(20), sender_id: MIKE.id, content: "Hi Robert, no problem. Banging noises usually mean limescale build-up or air in the system. I can come Thursday afternoon if that suits?", minutesAgo: 700 },
        { id: msgId(21), sender_id: ROBERT.id, content: "Thursday 2-4pm works perfectly. The tenant James is working from home. What's the likely cost?", minutesAgo: 680 },
        { id: msgId(22), sender_id: MIKE.id, content: "Standard call-out is £75 plus the hourly rate. If it just needs a flush and service, probably looking at £150-200 all in. If the heat exchanger needs replacing that could be more — I'll quote separately if so.", minutesAgo: 660 },
        { id: msgId(23), sender_id: ROBERT.id, content: "That's fine, go ahead. Just let me know if it's anything major before doing the work.", minutesAgo: 15 },
      ],
    },

    // 5. Sarah (buyer) <-> Emma (seller): direct question about property
    {
      id: convId(5),
      participant_1_id: SARAH.id,
      participant_2_id: EMMA.id,
      context_type: "listing",
      context_id: BATTERSEA_LISTING,
      messages: [
        { id: msgId(24), sender_id: SARAH.id, content: "Hi Emma, I viewed your property on Rosemary Lane last Saturday. Beautiful house! I had a couple of questions the agent couldn't answer on the spot.", minutesAgo: 2880 },
        { id: msgId(25), sender_id: EMMA.id, content: "Hello Sarah, glad you liked it! Happy to help — what would you like to know?", minutesAgo: 2820 },
        { id: msgId(26), sender_id: SARAH.id, content: "The kitchen extension — was that done under building regs or permitted development? And do you know if the loft has potential for conversion?", minutesAgo: 2790 },
        { id: msgId(27), sender_id: EMMA.id, content: "The extension was done under full building regs in 2019 — I have all the certificates. As for the loft, a surveyor told us it has good head height for conversion with dormers, but we never pursued it.", minutesAgo: 2760 },
        { id: msgId(28), sender_id: SARAH.id, content: "That's really helpful, thank you. We're very interested and will likely be putting an offer in through Victoria.", minutesAgo: 55 },
      ],
    },

    // 6. James (renter) <-> Mike (provider): bathroom repair scheduling
    {
      id: convId(6),
      participant_1_id: JAMES.id,
      participant_2_id: MIKE.id,
      context_type: "booking",
      context_id: null,
      messages: [
        { id: msgId(29), sender_id: MIKE.id, content: "Hi James, Robert mentioned the boiler issue at your flat. I'll be coming Thursday between 2-4pm to take a look. Will you be in?", minutesAgo: 600 },
        { id: msgId(30), sender_id: JAMES.id, content: "Hi Mike, yes I'll be here. Thanks for fitting me in so quickly. The boiler is a Worcester Bosch Greenstar if that helps.", minutesAgo: 580 },
        { id: msgId(31), sender_id: MIKE.id, content: "Good to know — I'm familiar with that model. I'll bring the usual service kit. If it's the heat exchanger I might need to order a part, but fingers crossed it's just a flush.", minutesAgo: 560 },
        { id: msgId(32), sender_id: JAMES.id, content: "Sounds good. The front door code is 4872 if I'm on a call when you arrive. Boiler cupboard is in the hallway.", minutesAgo: 22 },
      ],
    },

    // 7. Robert (landlord) <-> Victoria (agent): lettings enquiry
    {
      id: convId(7),
      participant_1_id: ROBERT.id,
      participant_2_id: VICTORIA.id,
      context_type: "general",
      context_id: null,
      messages: [
        { id: msgId(33), sender_id: ROBERT.id, content: "Hi Victoria, I'm thinking about letting another property I own in Edgbaston. Do you handle lettings in the Birmingham area?", minutesAgo: 4320 },
        { id: msgId(34), sender_id: VICTORIA.id, content: "Hi Robert! Yes, we cover Birmingham through our Midlands office. We charge 10% + VAT for full management or 6% for tenant find only. Would you like me to send over the full fee schedule?", minutesAgo: 4200 },
        { id: msgId(35), sender_id: ROBERT.id, content: "Full management would suit me as I'm based in London. What's involved in getting started?", minutesAgo: 4080 },
        { id: msgId(36), sender_id: VICTORIA.id, content: "I'd arrange a market appraisal first — we visit the property, assess rental value, and discuss any prep needed. Then we handle photos, listing, viewings, referencing, and the tenancy agreement. Shall I book an appraisal?", minutesAgo: 4000 },
        { id: msgId(37), sender_id: ROBERT.id, content: "Yes please. The property is at 5 Meadow Close, B15 2TT. I'm flexible on dates.", minutesAgo: 3900 },
        { id: msgId(38), sender_id: VICTORIA.id, content: "Perfect, I'll get our Birmingham team to arrange it. They'll be in touch within 48 hours. In the meantime, I'd estimate a rental value around £1,300-1,400 pcm for that area.", minutesAgo: 120 },
      ],
    },

    // 8. Victoria (agent) <-> Mike (provider): referral discussion
    {
      id: convId(8),
      participant_1_id: VICTORIA.id,
      participant_2_id: MIKE.id,
      context_type: "general",
      context_id: null,
      messages: [
        { id: msgId(39), sender_id: VICTORIA.id, content: "Hi Mike, one of my landlord clients needs a gas safety certificate for a rental property in SW11. Are you available this week?", minutesAgo: 1800 },
        { id: msgId(40), sender_id: MIKE.id, content: "Hi Victoria, yes I can do that. I charge £65 for a standard CP12 gas safety check. When does the current certificate expire?", minutesAgo: 1750 },
        { id: msgId(41), sender_id: VICTORIA.id, content: "End of this month, so fairly urgent. The property is a 2-bed flat with a combi boiler and gas hob.", minutesAgo: 1700 },
        { id: msgId(42), sender_id: MIKE.id, content: "No problem, I can fit that in on Wednesday morning. I'll also check the appliances and give you a written report same day. Shall I invoice the landlord directly or through your office?", minutesAgo: 1650 },
        { id: msgId(43), sender_id: VICTORIA.id, content: "Invoice through our office please — I'll forward to the landlord. I'll send you the property details and access arrangements by end of today.", minutesAgo: 1600 },
        { id: msgId(44), sender_id: MIKE.id, content: "Perfect. Also happy to be added to your preferred tradesperson list if you have one — I do regular work for several letting agents in the area.", minutesAgo: 10 },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildConversationRows(
  conversations: ConversationDef[],
): Record<string, unknown>[] {
  return conversations.map((c) => {
    // last_message_at is the timestamp of the most recent message
    const latestMsg = c.messages.reduce((a, b) =>
      a.minutesAgo < b.minutesAgo ? a : b,
    );
    return {
      id: c.id,
      participant_1_id: c.participant_1_id,
      participant_2_id: c.participant_2_id,
      context_type: c.context_type,
      context_id: c.context_id,
      last_message_at: minutesAgo(latestMsg.minutesAgo).toISOString(),
      created_at: minutesAgo(c.messages[0].minutesAgo + 5).toISOString(),
    };
  });
}

function buildMessageRows(
  conversations: ConversationDef[],
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const c of conversations) {
    for (const m of c.messages) {
      rows.push({
        id: m.id,
        conversation_id: c.id,
        sender_id: m.sender_id,
        content: m.content,
        attachment_url: null,
        attachment_type: null,
        attachment_size_bytes: null,
        created_at: minutesAgo(m.minutesAgo).toISOString(),
      });
    }
  }
  return rows;
}

function buildReadStatusRows(
  conversations: ConversationDef[],
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const c of conversations) {
    // The non-last-sender has read up to ~halfway through
    const latestMsg = c.messages.reduce((a, b) =>
      a.minutesAgo < b.minutesAgo ? a : b,
    );
    const otherParticipant =
      latestMsg.sender_id === c.participant_1_id
        ? c.participant_2_id
        : c.participant_1_id;

    // Last sender has read everything
    rows.push({
      conversation_id: c.id,
      user_id: latestMsg.sender_id,
      last_read_at: minutesAgo(latestMsg.minutesAgo).toISOString(),
    });

    // Other participant read up to ~30 min before latest message (simulates unread)
    rows.push({
      conversation_id: c.id,
      user_id: otherParticipant,
      last_read_at: minutesAgo(latestMsg.minutesAgo + 30).toISOString(),
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function seedMessaging(
  supabase: SupabaseClient,
  _scenario: Scenario,
): Promise<void> {
  console.log("\n--- Seeding Messaging ---");

  const conversations = buildConversations();
  const conversationRows = buildConversationRows(conversations);
  const messageRows = buildMessageRows(conversations);

  await seedTable(supabase, "conversations", conversationRows);
  await seedTable(supabase, "messages", messageRows);

  // conversation_read_status has composite PK (conversation_id, user_id), not `id`
  // Use direct upsert with the correct conflict columns
  const readStatusRows = buildReadStatusRows(conversations);
  if (readStatusRows.length > 0) {
    console.log(
      `  Seeding conversation_read_status: ${readStatusRows.length} rows...`,
    );
    const { error } = await supabase
      .from("conversation_read_status")
      .upsert(readStatusRows, {
        onConflict: "conversation_id,user_id",
      });
    if (error) {
      console.error(
        `  ERROR seeding conversation_read_status: ${error.message}`,
      );
    } else {
      console.log(
        `  Seeded conversation_read_status: ${readStatusRows.length} rows`,
      );
    }
  }
}
