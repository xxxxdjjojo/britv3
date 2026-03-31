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
    <div className="bg-[--color-surface] rounded-xl p-4">
      <p className="text-xs font-semibold text-[--color-on-surface]/40 uppercase tracking-wide">
        {contact.role}
      </p>
      {contact.name && (
        <p className="text-sm font-bold text-[--color-on-surface] mt-1">{contact.name}</p>
      )}
      <div className="flex flex-col gap-1.5 mt-2">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-xs text-[--color-brand-primary] hover:underline"
          >
            <Mail size={12} strokeWidth={1.25} />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-xs text-[--color-on-surface]/60 hover:text-[--color-on-surface] transition-colors"
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
      <h3 className="font-semibold text-[--color-on-surface] mb-4">Key Contacts</h3>
      {contacts.length === 0 ? (
        <div className="text-center py-10">
          <Users
            size={28}
            className="mx-auto text-[--color-on-surface]/20 mb-2"
            strokeWidth={1.25}
          />
          <p className="text-sm text-[--color-on-surface]/40">No contacts added yet</p>
          <p className="text-xs text-[--color-on-surface]/25 mt-1">
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
