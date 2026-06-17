import { Phone, Mail } from "lucide-react";
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
    <div className="bg-surface rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {contact.role}
      </p>
      {contact.name && (
        <p className="text-sm font-bold text-slate-900 mt-1">{contact.name}</p>
      )}
      <div className="flex flex-col gap-1.5 mt-2">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-xs text-brand-primary hover:underline"
          >
            <Mail size={12} />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900"
          >
            <Phone size={12} />
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 font-['Plus_Jakarta_Sans']">
        Key Contacts
      </h3>
      {contacts.length === 0 ? (
        <p className="text-sm text-slate-400">No contacts added yet</p>
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
