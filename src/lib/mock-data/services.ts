export type MockServiceCategory = {
  slug: string;
  title: string;
  icon: string;
  count: number;
  description: string;
};

export const MOCK_SERVICE_CATEGORIES: MockServiceCategory[] = [
  { slug: "plumbers", title: "Plumbers", icon: "Wrench", count: 142, description: "Emergency repairs, installations, and maintenance." },
  { slug: "electricians", title: "Electricians", icon: "Zap", count: 98, description: "Rewiring, inspections, and smart home setups." },
  { slug: "builders", title: "Builders", icon: "HardHat", count: 210, description: "Renovations, extensions, and new builds." },
  { slug: "estate-agents", title: "Estate Agents", icon: "Building2", count: 354, description: "Local experts for buying, selling, and letting." },
  { slug: "mortgage-brokers", title: "Mortgage Brokers", icon: "Calculator", count: 156, description: "Find the best rates and tailored financial advice." },
  { slug: "surveyors", title: "Surveyors", icon: "Ruler", count: 87, description: "RICS valuations, homebuyer reports, and audits." },
];
