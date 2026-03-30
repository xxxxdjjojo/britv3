import { Phone, Mail, Users } from "lucide-react";
import type { SaleProgressionStage } from "@/types/seller";

type Contact = Readonly<{
  role: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
}>;

type Props = Readonly<{
  progression: SaleProgressionStage;
}>;

function ContactCard({ contact }: Readonly<{ contact: Contact }>) {
  if (!contact.name && !contact.email) return null;
  return (
    <div className="bg-[#faf9f8] rounded-xl p-4">
      <p className="text-xs font-semibold text-[#1a1c1c]/40 uppercase tracking-wide">
        {contact.role}
      </p>
      {contact.name && (
        <p className="text-sm font-bold text-[#1a1c1c] mt-1">{contact.name}</p>
      )}
      <div className="flex flex-col gap-1.5 mt-2">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-xs text-[#1B4D3E] hover:underline"
          >
            <Mail size={12} strokeWidth={1.25} />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-xs text-[#1a1c1c]/60 hover:text-[#1a1c1c] transition-colors"
          >
            <Phone size={12} strokeWidth={1.25} />
            {contact.phone}
          </a>
        )}
      </div>
    </div>
  );
}

export function SaleContactsSidebar({ progression }: Props) {
  const contacts: Contact[] = [
    {
      role: "Your Solicitor",
      name: progression.solicitor_name,
      email: progression.solicitor_email,
      phone: progression.solicitor_phone,
    },
    {
      role: "Buyer's Solicitor",
      name: progression.buyer_solicitor_name,
      email: progression.buyer_solicitor_email,
    },
    {
      role: "Mortgage Broker",
      name: progression.mortgage_broker_name,
      email: null,
    },
  ].filter((c) => c.name || c.email);

  return (
    <div className="bg-white rounded-2xl p-6">
      <h3 className="font-semibold text-[#1a1c1c] mb-4">Key Contacts</h3>
      {contacts.length === 0 ? (
        <div className="text-center py-10">
          <Users
            size={28}
            className="mx-auto text-[#1a1c1c]/20 mb-2"
            strokeWidth={1.25}
          />
          <p className="text-sm text-[#1a1c1c]/40">No contacts added yet</p>
          <p className="text-xs text-[#1a1c1c]/25 mt-1">
            Add your solicitor details when you have them
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <ContactCard key={c.role} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
