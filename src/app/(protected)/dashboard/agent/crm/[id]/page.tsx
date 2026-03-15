import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ClientProfile } from "@/components/dashboard/agent/crm/ClientProfile";
import type { ClientProfileData } from "@/components/dashboard/agent/crm/ClientProfile";
import { getCrmClientById } from "@/services/agent/agent-crm-service";

type PageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Client ${id} — CRM`,
  };
}

export default async function CrmClientPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the CRM client
  let client: Awaited<ReturnType<typeof getCrmClientById>>;
  try {
    client = await getCrmClientById(supabase, id, user.id);
  } catch {
    notFound();
  }

  // Fetch communication history: messages in conversations where the client's
  // user_id is a participant. Gracefully returns empty on error.
  type MessageRow = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    profiles?: { full_name?: string | null }[] | null;
  };
  let messages: ClientProfileData["messages"] = [];
  if (client.user_id) {
    try {
      const { data: convData } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", client.user_id)
        .limit(10);

      if (convData && convData.length > 0) {
        const convIds = convData.map(
          (r: { conversation_id: string }) => r.conversation_id,
        );
        const { data: msgData } = await supabase
          .from("messages")
          .select(
            "id, sender_id, content, created_at, profiles:sender_id(full_name)",
          )
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
          .limit(50);

        messages = (msgData ?? []).map((m: MessageRow) => ({
          id: m.id,
          sender_id: m.sender_id,
          content: m.content,
          created_at: m.created_at,
          sender_name: m.profiles?.[0]?.full_name ?? null,
        }));
      }
    } catch {
      // Communication data not available in this environment
    }
  }

  // Fetch linked properties depending on client type
  type PropertyRow = {
    id: string;
    title?: string | null;
    address_line_1?: string | null;
    city?: string | null;
    postcode?: string | null;
    price?: number | null;
    status?: string | null;
  };
  let properties: ClientProfileData["properties"] = [];
  if (client.user_id) {
    try {
      if (
        client.client_type === "buyer" ||
        client.client_type === "tenant"
      ) {
        // Properties the client has enquired about
        const { data: enquiryData } = await supabase
          .from("property_enquiries")
          .select(
            "properties:property_id(id, title, address_line_1, city, postcode, price, status)",
          )
          .eq("user_id", client.user_id)
          .limit(20);

        properties = (enquiryData ?? []).flatMap((row: { properties?: PropertyRow | PropertyRow[] | null }) => {
          const prop = row.properties;
          if (!prop) return [];
          const p = Array.isArray(prop) ? prop[0] : prop;
          if (!p) return [];
          return [
            {
              id: p.id,
              title: p.title ?? "Unnamed property",
              address: [p.address_line_1, p.city, p.postcode]
                .filter(Boolean)
                .join(", "),
              price: p.price ?? null,
              status: p.status ?? null,
            },
          ];
        });
      } else if (
        client.client_type === "seller" ||
        client.client_type === "landlord"
      ) {
        // Properties owned/managed by this client
        const { data: propData } = await supabase
          .from("properties")
          .select("id, title, address_line_1, city, postcode, price, status")
          .eq("user_id", client.user_id)
          .limit(20);

        properties = (propData ?? []).map((p: PropertyRow) => ({
          id: p.id,
          title: p.title ?? "Unnamed property",
          address: [p.address_line_1, p.city, p.postcode]
            .filter(Boolean)
            .join(", "),
          price: p.price ?? null,
          status: p.status ?? null,
        }));
      }
    } catch {
      // Properties data not available in this environment
    }
  }

  // Fetch linked transactions (offers, viewings, sales)
  type OfferRow = {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    property_id: string;
  };
  type ViewingRow = {
    id: string;
    start_time: string;
    is_booked: boolean;
    property_id: string;
  };
  let transactions: ClientProfileData["transactions"] = [];
  try {
    // Offers where buyer_email matches (or buyer_name if no email)
    const { data: offerData } = await supabase
      .from("agent_offers")
      .select("id, amount, status, created_at, property_id")
      .eq("agent_id", user.id)
      .eq("buyer_email", client.email ?? "")
      .limit(20);

    const offerTransactions: ClientProfileData["transactions"] = (
      offerData ?? []
    ).map((o: OfferRow) => ({
      id: o.id,
      type: "offer" as const,
      label: `Offer — ${new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(o.amount / 100)}`,
      status: o.status,
      date: o.created_at,
      href: `/dashboard/agent/offers/${o.id}`,
    }));

    // Viewing slots booked by this client
    const viewingQuery = client.user_id
      ? supabase
          .from("agent_viewing_slots")
          .select("id, start_time, is_booked, property_id")
          .eq("agent_id", user.id)
          .eq("booked_by", client.user_id)
          .eq("is_booked", true)
          .limit(20)
      : null;

    const viewingData = viewingQuery
      ? (await viewingQuery).data
      : null;

    const viewingTransactions: ClientProfileData["transactions"] = (
      viewingData ?? []
    ).map((v: ViewingRow) => ({
      id: v.id,
      type: "viewing" as const,
      label: `Viewing — ${new Date(v.start_time).toLocaleDateString("en-GB")}`,
      status: v.is_booked ? "Booked" : "Available",
      date: v.start_time,
      href: `/dashboard/agent/viewings`,
    }));

    transactions = [...offerTransactions, ...viewingTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch {
    // Transactions data not available in this environment
  }

  return (
    <ClientProfile
      client={client}
      messages={messages}
      properties={properties}
      transactions={transactions}
    />
  );
}
