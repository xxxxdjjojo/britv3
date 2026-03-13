/**
 * Agent CRM service -- CRUD for CRM clients, search, and filtering.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentCrmClient, CreateCrmClientInput } from "@/types/agent";
import { createCrmClientSchema } from "@/types/agent";

// -- Service functions --------------------------------------------------------

/**
 * List CRM clients for an agent with optional filters and pagination.
 */
export async function getCrmClients(
  supabase: SupabaseClient,
  agentId: string,
  filters?: {
    client_type?: string;
    search?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  },
): Promise<{ data: AgentCrmClient[]; count: number }> {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("agent_crm_clients")
    .select("*", { count: "exact" })
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })
    .range(from, to);

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

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch CRM clients: ${error.message}`);
  }

  return {
    data: (data ?? []) as AgentCrmClient[],
    count: count ?? 0,
  };
}

/**
 * Fetch a single CRM client by ID, scoped to an agent.
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

  if (error || !data) {
    throw new Error(error?.message ?? "CRM client not found");
  }

  return data as AgentCrmClient;
}

/**
 * Create a new CRM client.
 */
export async function createCrmClient(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateCrmClientInput,
): Promise<AgentCrmClient> {
  const parsed = createCrmClientSchema.parse(input);

  const insertData = {
    agent_id: agentId,
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    client_type: parsed.client_type,
    preferences: {},
    notes: parsed.notes || null,
    tags: parsed.tags ?? null,
  };

  const { data, error } = await supabase
    .from("agent_crm_clients")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create CRM client: ${error.message}`);
  }

  return data as AgentCrmClient;
}

/**
 * Update an existing CRM client. Sets last_contact_at to now.
 */
export async function updateCrmClient(
  supabase: SupabaseClient,
  clientId: string,
  agentId: string,
  input: Partial<CreateCrmClientInput>,
): Promise<AgentCrmClient> {
  const updateData: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
    last_contact_at: new Date().toISOString(),
  };

  // Normalize empty strings to null
  if (updateData.email === "") updateData.email = null;
  if (updateData.phone === "") updateData.phone = null;
  if (updateData.notes === "") updateData.notes = null;

  const { data, error } = await supabase
    .from("agent_crm_clients")
    .update(updateData)
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
 * Search CRM clients across name, email, phone, and notes fields.
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
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to search CRM clients: ${error.message}`);
  }

  return (data ?? []) as AgentCrmClient[];
}
