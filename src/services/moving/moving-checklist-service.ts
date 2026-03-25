/**
 * Moving checklist service.
 * Manages the user's step-by-step buying journey checklist.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChecklistItem = {
  id: string;
  offer_id: string | null;
  title: string;
  description: string | null;
  offer_stage: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
};

/** Phase grouping for display */
export type ChecklistPhase =
  | "pre_offer"
  | "under_offer"
  | "exchange"
  | "completion"
  | "post_move"
  | "pre_application"
  | "application_submitted"
  | "references"
  | "tenancy_agreement"
  | "move_in";

// ---------------------------------------------------------------------------
// Default items
// ---------------------------------------------------------------------------

type DefaultItem = {
  title: string;
  description: string;
  offer_stage: string;
  sort_order: number;
};

const RENTER_DEFAULT_ITEMS: DefaultItem[] = [
  // pre_application phase
  {
    title: "Set your rental budget",
    description:
      "Calculate max affordable rent (ideally ≤ 30% of take-home pay).",
    offer_stage: "pre_application",
    sort_order: 1,
  },
  {
    title: "Gather reference documents",
    description:
      "Prepare proof of income, employer reference, previous landlord details, and photo ID.",
    offer_stage: "pre_application",
    sort_order: 2,
  },

  // application_submitted phase
  {
    title: "Submit rental application",
    description:
      "Complete the letting agent's application form with your details.",
    offer_stage: "application_submitted",
    sort_order: 10,
  },
  {
    title: "Pay holding deposit",
    description:
      "Pay the holding deposit (max 1 week's rent under the Tenant Fees Act 2019).",
    offer_stage: "application_submitted",
    sort_order: 11,
  },

  // references phase
  {
    title: "Employer reference check",
    description:
      "Ensure your employer is ready to respond to the reference request.",
    offer_stage: "references",
    sort_order: 20,
  },
  {
    title: "Previous landlord reference",
    description:
      "Notify your previous landlord that a reference request is coming.",
    offer_stage: "references",
    sort_order: 21,
  },
  {
    title: "Credit check",
    description:
      "The agent will run a credit check — ensure your details are up to date.",
    offer_stage: "references",
    sort_order: 22,
  },

  // tenancy_agreement phase
  {
    title: "Review tenancy agreement",
    description:
      "Read every clause carefully. Check break clauses, notice periods, and restrictions.",
    offer_stage: "tenancy_agreement",
    sort_order: 30,
  },
  {
    title: "Pay security deposit",
    description:
      "Pay the security deposit (max 5 weeks' rent). Confirm it will be protected in a TDP scheme.",
    offer_stage: "tenancy_agreement",
    sort_order: 31,
  },

  // move_in phase
  {
    title: "Check inventory and condition report",
    description:
      "Walk through the property with the inventory, note and photograph any existing damage.",
    offer_stage: "move_in",
    sort_order: 40,
  },
  {
    title: "Collect keys and confirm meter readings",
    description:
      "Record gas, electric, and water meter readings on move-in day.",
    offer_stage: "move_in",
    sort_order: 41,
  },

  // post_move phase
  {
    title: "Set up utilities and council tax",
    description:
      "Contact energy, water, broadband providers, and register for council tax.",
    offer_stage: "post_move",
    sort_order: 50,
  },
  {
    title: "Update your address",
    description:
      "Bank, DVLA, HMRC, electoral roll, NHS, and Royal Mail redirection.",
    offer_stage: "post_move",
    sort_order: 51,
  },
];

const DEFAULT_ITEMS: DefaultItem[] = [
  // pre_offer phase
  {
    title: "Get Agreement in Principle (AIP)",
    description:
      "Get an AIP from a mortgage lender to understand your borrowing limit.",
    offer_stage: "pre_offer",
    sort_order: 1,
  },
  {
    title: "Find a solicitor / conveyancer",
    description:
      "Research and appoint a conveyancer to handle legal work.",
    offer_stage: "pre_offer",
    sort_order: 2,
  },
  {
    title: "Research the area",
    description:
      "Check schools, transport links, local amenities, and flood risk.",
    offer_stage: "pre_offer",
    sort_order: 3,
  },

  // under_offer phase
  {
    title: "Formal mortgage application",
    description: "Submit full mortgage application with your chosen lender.",
    offer_stage: "submitted",
    sort_order: 10,
  },
  {
    title: "Instruct solicitor",
    description: "Formally instruct your conveyancer and pay initial fees.",
    offer_stage: "solicitors_instructed",
    sort_order: 11,
  },
  {
    title: "Book property survey",
    description:
      "Commission a Level 2 or Level 3 survey depending on property age.",
    offer_stage: "survey",
    sort_order: 12,
  },
  {
    title: "Review search results",
    description:
      "Review local authority, water, and environmental searches.",
    offer_stage: "searches",
    sort_order: 13,
  },
  {
    title: "Review mortgage offer",
    description: "Carefully read your formal mortgage offer letter.",
    offer_stage: "mortgage_approved",
    sort_order: 14,
  },

  // exchange phase
  {
    title: "Pay exchange deposit",
    description:
      "Transfer exchange deposit (typically 10%) to your solicitor.",
    offer_stage: "exchange",
    sort_order: 20,
  },
  {
    title: "Arrange buildings insurance",
    description: "Buildings insurance must be in place from exchange.",
    offer_stage: "exchange",
    sort_order: 21,
  },
  {
    title: "Confirm completion date",
    description: "Agree completion date with all parties in the chain.",
    offer_stage: "exchange",
    sort_order: 22,
  },

  // completion phase
  {
    title: "Transfer completion funds",
    description: "Transfer remaining funds to your solicitor.",
    offer_stage: "completion",
    sort_order: 30,
  },
  {
    title: "Collect keys",
    description: "Collect keys from the estate agent on completion day.",
    offer_stage: "completion",
    sort_order: 31,
  },
  {
    title: "Register with Land Registry",
    description:
      "Your solicitor will handle this — confirm it's done.",
    offer_stage: "completion",
    sort_order: 32,
  },

  // post_move phase
  {
    title: "Redirect post",
    description: "Set up mail redirection with Royal Mail.",
    offer_stage: "post_move",
    sort_order: 40,
  },
  {
    title: "Update address on all accounts",
    description:
      "Bank, DVLA, HMRC, electoral roll, utilities, NHS.",
    offer_stage: "post_move",
    sort_order: 41,
  },
  {
    title: "Set up utilities",
    description: "Contact energy, water, broadband providers.",
    offer_stage: "post_move",
    sort_order: 42,
  },
  {
    title: "Council tax registration",
    description: "Register with local council for council tax.",
    offer_stage: "post_move",
    sort_order: 43,
  },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all checklist items for a user, optionally filtered by offer_id.
 * Results are ordered by sort_order ascending.
 */
export async function getChecklistItems(
  supabase: SupabaseClient,
  userId: string,
  offerId?: string,
): Promise<ChecklistItem[]> {
  let query = supabase
    .from("moving_checklist_items")
    .select(
      "id, offer_id, title, description, offer_stage, is_completed, completed_at, sort_order, created_at",
    )
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (offerId) {
    query = query.eq("offer_id", offerId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get checklist items: ${error.message}`);
  }

  return (data ?? []) as ChecklistItem[];
}

/**
 * Toggle the completion state of a checklist item.
 * Verifies ownership via user_id before updating.
 * Sets completed_at to now() when completing, null when un-completing.
 */
export async function toggleChecklistItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  completed: boolean,
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from("moving_checklist_items")
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select(
      "id, offer_id, title, description, offer_stage, is_completed, completed_at, sort_order, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to toggle checklist item: ${error.message}`);
  }

  return data as ChecklistItem;
}

/**
 * Insert the default checklist items for a user+offer combo.
 * No-ops if items already exist (idempotent).
 */
export async function createDefaultChecklist(
  supabase: SupabaseClient,
  userId: string,
  offerId?: string,
  role: string = "homebuyer",
): Promise<ChecklistItem[]> {
  // Check for existing items
  let existingQuery = supabase
    .from("moving_checklist_items")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (offerId) {
    existingQuery = existingQuery.eq("offer_id", offerId);
  } else {
    existingQuery = existingQuery.is("offer_id", null);
  }

  const { data: existing } = await existingQuery;

  if (existing && existing.length > 0) {
    // Already exists — return current items
    return getChecklistItems(supabase, userId, offerId);
  }

  const sourceItems = role === "renter" ? RENTER_DEFAULT_ITEMS : DEFAULT_ITEMS;
  const rows = sourceItems.map((item) => ({
    user_id: userId,
    offer_id: offerId ?? null,
    title: item.title,
    description: item.description,
    offer_stage: item.offer_stage,
    sort_order: item.sort_order,
    is_completed: false,
  }));

  const { data, error } = await supabase
    .from("moving_checklist_items")
    .insert(rows)
    .select(
      "id, offer_id, title, description, offer_stage, is_completed, completed_at, sort_order, created_at",
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to create default checklist: ${error.message}`);
  }

  return (data ?? []) as ChecklistItem[];
}

/**
 * Add a single custom checklist item for a user.
 * Sets sort_order to max existing + 1 so it appears at the end.
 * Custom items have offer_stage = null.
 */
export async function addCustomItem(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  description?: string | null,
): Promise<ChecklistItem> {
  // Get the current max sort_order
  const { data: maxRow } = await supabase
    .from("moving_checklist_items")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("moving_checklist_items")
    .insert({
      user_id: userId,
      offer_id: null,
      title,
      description: description ?? null,
      offer_stage: null,
      sort_order: nextOrder,
      is_completed: false,
    })
    .select(
      "id, offer_id, title, description, offer_stage, is_completed, completed_at, sort_order, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to add custom item: ${error.message}`);
  }

  return data as ChecklistItem;
}
