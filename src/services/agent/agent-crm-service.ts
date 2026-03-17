/**
 * Agent CRM service -- client relationship management including CRUD operations,
 * search, filtering, pagination, and last-contact tracking.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentCrmClient,
  ClientType,
  CreateCrmClientInput,
  UpdateCrmClientInput,
} from "@/types/agent";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";

export type CrmClientsPage = {
  clients: AgentCrmClient[];
  total: number;
  nextOffset: number | null;
};

/**
 * Returns a paginated, searchable, filterable list of CRM clients for the
 * given agent. Text search runs across name, email, phone, and notes using
 * ilike. Client-type filter accepts one or more ClientType values.
 */
export async function getCrmClients(
  supabase: SupabaseClient,
  agentId: string,
  options: {
    search?: string;
    clientTypes?: ClientType[];
    offset?: number;
    limit?: number;
  } = {},
): Promise<CrmClientsPage> {
  const { search, clientTypes, offset = 0, limit = 25 } = options;

  let query = supabase
    .from("agent_crm_clients")
    .select("*", { count: "exact" })
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search && search.trim()) {
    const safe = sanitizePostgrestInput(search.trim());
    if (safe.length > 0) {
      const term = `%${safe}%`;
      query = query.or(
        `name.ilike.${term},email.ilike.${term},phone.ilike.${term},notes.ilike.${term}`,
      );
    }
  }

  if (clientTypes && clientTypes.length > 0) {
    query = query.in("client_type", clientTypes);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const clients = (data ?? []) as AgentCrmClient[];
  const total = count ?? 0;
  const nextOffset = offset + clients.length < total ? offset + limit : null;

  return { clients, total, nextOffset };
}

/**
 * Fetches a single CRM client by ID, verifying it belongs to the given agent.
 */
export async function getCrmClientById(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
): Promise<AgentCrmClient> {
  const { data, error } = await supabase
    .from("agent_crm_clients")
    .select("*")
    .eq("id", clientId)
    .eq("agent_id", agentId)
    .single();

  if (error) throw error;
  return data as AgentCrmClient;
}

/**
 * Creates a new CRM client for the given agent.
 */
export async function createCrmClient(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateCrmClientInput,
): Promise<AgentCrmClient> {
  const { data, error } = await supabase
    .from("agent_crm_clients")
    .insert({
      ...input,
      agent_id: agentId,
      tags: input.tags ?? [],
      preferences: input.preferences ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as AgentCrmClient;
}

/**
 * Updates an existing CRM client. Automatically bumps last_contact_at when
 * notes, preferences, or tags are touched.
 */
export async function updateCrmClient(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
  input: UpdateCrmClientInput,
): Promise<AgentCrmClient> {
  const touchesContactFields =
    input.notes !== undefined ||
    input.preferences !== undefined ||
    input.tags !== undefined;

  const payload: Record<string, unknown> = {
    ...input,
    ...(touchesContactFields
      ? { last_contact_at: new Date().toISOString() }
      : {}),
  };

  const { data, error } = await supabase
    .from("agent_crm_clients")
    .update(payload)
    .eq("id", clientId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) throw error;
  return data as AgentCrmClient;
}

/**
 * Deletes a CRM client. Requires agent ownership.
 */
export async function deleteCrmClient(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("agent_crm_clients")
    .delete()
    .eq("id", clientId)
    .eq("agent_id", agentId);

  if (error) throw error;
}

/**
 * Adds a tag to the client's tags array (idempotent).
 */
export async function addTagToCrmClient(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
  tag: string,
): Promise<AgentCrmClient> {
  const client = await getCrmClientById(supabase, clientId, agentId);
  const tags = Array.from(new Set([...client.tags, tag]));
  return updateCrmClient(supabase, clientId, agentId, { tags });
}

/**
 * Removes a tag from the client's tags array.
 */
export async function removeTagFromCrmClient(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
  tag: string,
): Promise<AgentCrmClient> {
  const client = await getCrmClientById(supabase, clientId, agentId);
  const tags = client.tags.filter((t) => t !== tag);
  return updateCrmClient(supabase, clientId, agentId, { tags });
}
