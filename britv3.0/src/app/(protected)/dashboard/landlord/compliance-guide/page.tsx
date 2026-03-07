import { ExternalLink, Shield } from "lucide-react";

type ComplianceItem = Readonly<{
  title: string;
  description: string;
  frequency: string;
  link: string;
  linkText: string;
}>;

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    title: "Gas Safety Certificate",
    description:
      "All gas appliances, fittings, and flues must be checked annually by a Gas Safe registered engineer. A copy of the certificate must be given to tenants within 28 days of the check and before they move in.",
    frequency: "Annual",
    link: "https://www.gov.uk/private-renting/your-landlords-safety-responsibilities",
    linkText: "Gov.uk - Landlord gas safety",
  },
  {
    title: "Electrical Installation Condition Report (EICR)",
    description:
      "All electrical installations must be inspected and tested by a qualified electrician. The report must be provided to new tenants before they move in and to existing tenants within 28 days of the inspection.",
    frequency: "Every 5 years",
    link: "https://www.gov.uk/government/publications/electrical-safety-standards-in-the-private-rented-sector-guidance-for-landlords-tenants-and-local-authorities",
    linkText: "Gov.uk - Electrical safety standards",
  },
  {
    title: "Energy Performance Certificate (EPC)",
    description:
      "An EPC rates the energy efficiency of the property from A (most efficient) to G (least efficient). Rental properties must have a minimum EPC rating of E. The certificate must be provided to prospective tenants.",
    frequency: "Valid for 10 years",
    link: "https://www.gov.uk/buy-sell-your-home/energy-performance-certificates",
    linkText: "Gov.uk - Energy Performance Certificates",
  },
  {
    title: "Deposit Protection",
    description:
      "If you take a deposit, you must protect it in a government-approved tenancy deposit scheme within 30 days of receiving it. You must also provide the tenant with prescribed information about the scheme.",
    frequency: "Within 30 days of receipt",
    link: "https://www.gov.uk/tenancy-deposit-protection",
    linkText: "Gov.uk - Tenancy deposit protection",
  },
  {
    title: "Right to Rent Checks",
    description:
      "You must check that all tenants aged 18 or over have the right to rent in England before the start of the tenancy. This includes checking original identity documents. Follow-up checks are required for time-limited permissions.",
    frequency: "Before tenancy starts",
    link: "https://www.gov.uk/check-tenant-right-to-rent-documents",
    linkText: "Gov.uk - Check tenant's right to rent",
  },
  {
    title: "Smoke and Carbon Monoxide Alarms",
    description:
      "Working smoke alarms must be installed on every storey of the property. Carbon monoxide alarms must be installed in any room with a fixed combustion appliance (excluding gas cookers). Alarms must be tested at the start of each tenancy.",
    frequency: "Tested at start of each tenancy",
    link: "https://www.gov.uk/government/publications/smoke-and-carbon-monoxide-alarms-explanatory-booklet-for-landlords",
    linkText: "Gov.uk - Smoke and CO alarm requirements",
  },
  {
    title: "Landlord Licensing",
    description:
      "Some local authorities operate selective or additional licensing schemes for private landlords. Check with your local council whether you need a licence to rent out your property. Mandatory HMO licensing applies to properties with 5+ tenants from 2+ households.",
    frequency: "Varies by local authority",
    link: "https://www.gov.uk/house-in-multiple-occupation-licence",
    linkText: "Gov.uk - HMO licensing",
  },
  {
    title: "How to Rent Guide",
    description:
      "You must provide all new tenants with the latest version of the government's 'How to Rent' guide at the start of their tenancy. This is a legal requirement and failure to provide it may prevent you from serving a Section 21 notice.",
    frequency: "At start of each tenancy",
    link: "https://www.gov.uk/government/publications/how-to-rent",
    linkText: "Gov.uk - How to Rent guide",
  },
];

export default function ComplianceGuidePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-1 h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            UK Rental Compliance Guide
          </h1>
          <p className="text-sm text-muted-foreground">
            Essential legal requirements for private landlords in England. Keep
            your properties compliant and your tenants safe.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {COMPLIANCE_ITEMS.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-border bg-card p-5"
          >
            <h2 className="text-base font-semibold">{item.title}</h2>
            <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item.frequency}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {item.linkText}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>Note:</strong> This guide covers requirements for England only.
        Different rules may apply in Scotland, Wales, and Northern Ireland.
        Always check with your local authority for area-specific requirements.
        This information is provided for general guidance and should not be
        considered legal advice.
      </div>
    </div>
  );
}
