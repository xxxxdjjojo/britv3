/**
 * Agent CRM service.
 * Manages CRM clients for estate agents.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentCrmClient, ClientType, CreateCrmClientInput } from "@/types/agent";

/** Communication-related fields that should update last_contact_at */
const COMMUNICATION_FIELDS: Array<keyof CreateCrmClientInput> = ["notes"];

/**
 * Get all CRM clients for an agent with optional filtering and pagination.
 */
export async function getCrmClients(
  supabase: SupabaseClient,
  agentId: string,
  filters?: {
    client_type?: ClientType;
    search?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  },
): Promise<AgentCrmClient[]> {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("agent_crm_clients")
    .select("*")
    .eq("agent_id", agentId);

  if (filters?.client_type) {
    query = query.eq("client_type", filters.client_type);
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term}`);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get CRM clients: ${error.message}`);
  }

  return (data ?? []) as AgentCrmClient[];
}

/**
 * Get a single CRM client by ID, scoped to the agent.
 */
export async function getCrmClientById(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
): Promise<AgentCrmClient | null> {
  const { data, error } = await supabase
    .from("agent_crm_clients")
    .select("*")
    .eq("id", clientId)
    .eq("agent_id", agentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get CRM client: ${error.message}`);
  }

  return data as AgentCrmClient;
}

/**
 * Create a new CRM client for an agent.
 */
export async function createCrmClient(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateCrmClientInput,
): Promise<AgentCrmClient> {
  const { data, error } = await supabase
    .from("agent_crm_clients")
    .insert({
      agent_id: agentId,
      user_id: input.user_id ?? null,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      client_type: input.client_type,
      preferences: input.preferences ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create CRM client: ${error.message}`);
  }

  return data as AgentCrmClient;
}

/**
 * Update an existing CRM client.
 * Sets last_contact_at=NOW() if communication-related fields are updated.
 */
export async function updateCrmClient(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
  input: Partial<CreateCrmClientInput>,
): Promise<AgentCrmClient> {
  const hasCommunicationFields = COMMUNICATION_FIELDS.some(
    (field) => field in input,
  );

  const updatePayload: Record<string, unknown> = { ...input };

  if (hasCommunicationFields) {
    updatePayload.last_contact_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("agent_crm_clients")
    .update(updatePayload)
    .eq("id", clientId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update CRM client: ${error.message}`);
  }

  return data as AgentCrmClient;
}

/**
 * Full-text search across CRM clients' name, email, phone, and notes.
 */
export async function searchCrmClients(
  supabase: SupabaseClient,
  agentId: string,
  query: string,
): Promise<AgentCrmClient[]> {
  const term = `%${query}%`;

  const { data, error } = await supabase
    .from("agent_crm_clients")
    .select("*")
    .eq("agent_id", agentId)
    .or(
      `name.ilike.${term},email.ilike.${term},phone.ilike.${term},notes.ilike.${term}`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to search CRM clients: ${error.message}`);
  }

  return (data ?? []) as AgentCrmClient[];
}
