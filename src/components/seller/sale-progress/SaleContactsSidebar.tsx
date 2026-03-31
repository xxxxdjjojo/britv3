import { Phone, Mail, MessageSquare, Users } from "lucide-react";
import type { SaleProgressionStage } from "@/types/seller";

type Contact = Readonly<{
  role: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  initials: string;
  showChat?: boolean;
}>;

type Props = Readonly<{
  progression: SaleProgressionStage;
}>;

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ContactRow({ contact }: Readonly<{ contact: Contact }>) {
  if (!contact.name && !contact.email) return null;

  return (
    <>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em] mb-3">
          {contact.role}
        </span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {contact.initials}
            </div>
            <div>
              {contact.name && (
                <p className="text-sm font-bold text-stone-900">
                  {contact.name}
                </p>
              )}
              {contact.email && (
                <p className="text-xs text-stone-400 truncate max-w-[140px]">
                  {contact.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1.5">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 hover:bg-emerald-50 text-emerald-900 transition-colors"
                aria-label={`Call ${contact.name}`}
              >
                <Phone size={14} strokeWidth={1.5} />
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 hover:bg-emerald-50 text-emerald-900 transition-colors"
                aria-label={`Email ${contact.name}`}
              >
                <Mail size={14} strokeWidth={1.5} />
              </a>
            )}
            {contact.showChat && (
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 hover:bg-emerald-50 text-emerald-900 transition-colors"
                aria-label={`Message ${contact.name}`}
              >
                <MessageSquare size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
      <hr className="border-stone-100" />
    </>
  );
}

export function SaleContactsSidebar({ progression }: Props) {
  const contacts: Contact[] = [
    {
      role: "Your Solicitor",
      name: progression.solicitor_name,
      email: progression.solicitor_email,
      phone: progression.solicitor_phone,
      initials: getInitials(progression.solicitor_name),
    },
    {
      role: "Buyer's Solicitor",
      name: progression.buyer_solicitor_name,
      email: progression.buyer_solicitor_email,
      initials: getInitials(progression.buyer_solicitor_name),
    },
    {
      role: "Mortgage Broker",
      name: progression.mortgage_broker_name,
      email: null,
      initials: getInitials(progression.mortgage_broker_name),
      showChat: true,
    },
  ].filter((c) => c.name || c.email);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-emerald-900 mb-6">
        Key Contacts
      </h2>
      {contacts.length === 0 ? (
        <div className="text-center py-10">
          <Users
            size={28}
            className="mx-auto text-stone-200 mb-2"
            strokeWidth={1.25}
          />
          <p className="text-sm text-stone-400">No contacts added yet</p>
          <p className="text-xs text-stone-300 mt-1">
            Add your solicitor details when you have them
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {contacts.map((c) => (
            <ContactRow key={c.role} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
