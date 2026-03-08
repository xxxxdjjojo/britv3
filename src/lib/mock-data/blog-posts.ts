export type MockBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: { name: string; avatar: string; role: string };
  date: string;
  readTime: string;
  image: string;
  content: string;
};

export const MOCK_BLOG_POSTS: MockBlogPost[] = [
  {
    slug: "uk-property-market-forecast-2026",
    title: "UK Property Market Forecast: What to Expect in 2026",
    excerpt: "As interest rates stabilise, we analyse the potential growth areas and investment opportunities across major UK cities for the upcoming year.",
    category: "Market Trends",
    author: { name: "Emma Richards", avatar: "/images/agents/agent-3.jpg", role: "Property Analyst" },
    date: "2026-02-28",
    readTime: "8 min read",
    image: "/images/blog/blog-1.jpg",
    content: "The UK property market is entering an exciting phase in 2026. After a period of adjustment following the Bank of England's interest rate changes, the market is showing signs of renewed confidence.\n\n## Key Trends for 2026\n\nFirst-time buyers are returning to the market in force, buoyed by improved mortgage affordability and government support schemes. The average house price across England and Wales stands at £305,000, with regional variations continuing to play a significant role.\n\n### Northern Powerhouse Growth\n\nManchester, Leeds, and Liverpool continue to outperform London in terms of price growth. Manchester has seen a 6.2% increase year-on-year, driven by significant regeneration projects and growing tech sector employment.\n\n### London's Recovery\n\nAfter several years of subdued growth, London's property market is stabilising. Prime central London has seen renewed interest from international buyers, while outer boroughs like Bromley and Croydon offer better value for families.\n\n## What This Means for Buyers\n\nIf you're looking to buy in 2026, the fundamentals are improving. Mortgage rates have settled around 4-4.5% for a standard 5-year fix, making monthly payments more predictable. Our advice: focus on areas with strong transport links and regeneration investment.\n\n## Investment Opportunities\n\nBuy-to-let landlords should consider university cities where rental demand remains strong. Birmingham, Nottingham, and Bristol all show rental yields above 5%, making them attractive for portfolio growth.",
  },
  {
    slug: "first-time-buyer-checklist",
    title: "First-Time Buyer's Checklist: From Viewing to Keys",
    excerpt: "Navigating your first property purchase can be daunting. Our comprehensive guide breaks down every step of the process.",
    category: "Buying Guide",
    author: { name: "Sarah Thompson", avatar: "/images/agents/agent-2.jpg", role: "Senior Editor" },
    date: "2026-02-18",
    readTime: "12 min read",
    image: "/images/blog/blog-2.jpg",
    content: "Buying your first home is one of the biggest financial decisions you'll make. This guide walks you through every stage of the process.\n\n## Before You Start Searching\n\n1. **Get your finances in order** — Review your credit score, save for a deposit (typically 5-20% of the property price), and research government help-to-buy schemes.\n\n2. **Get a mortgage Agreement in Principle (AIP)** — This shows sellers you're a serious buyer. Most lenders will provide one within 24-48 hours.\n\n3. **Calculate your budget** — Don't forget stamp duty, solicitor fees (£1,000-2,000), survey costs (£300-1,500), and moving costs.\n\n## The Search\n\n4. **Define your must-haves** — Location, number of bedrooms, garden, parking. Be clear about non-negotiables vs nice-to-haves.\n\n5. **Set up alerts** — Use Britestate's AI-powered search to get instant notifications for matching properties.\n\n6. **View strategically** — Visit properties at different times of day. Check the area on foot. Talk to neighbours if possible.\n\n## Making an Offer\n\n7. **Research comparable sales** — Use Britestate's price history tool to see what similar properties sold for recently.\n\n8. **Make your offer** — Start below asking price if the market allows. Your estate agent can advise on strategy.\n\n## After the Offer\n\n9. **Instruct a solicitor** — They'll handle searches, contracts, and the legal transfer. Budget 8-12 weeks for conveyancing.\n\n10. **Get a survey** — Choose between a basic Homebuyer Report or a full Building Survey for older properties.",
  },
  {
    slug: "eco-friendly-upgrades",
    title: "Eco-Friendly Upgrades That Add Value to Your Home",
    excerpt: "Discover which sustainable improvements offer the best return on investment while lowering your carbon footprint.",
    category: "Sustainability",
    author: { name: "Tom Bradley", avatar: "/images/agents/agent-1.jpg", role: "Property Writer" },
    date: "2026-02-12",
    readTime: "6 min read",
    image: "/images/blog/blog-3.jpg",
    content: "With energy costs remaining high and buyers increasingly eco-conscious, green home improvements are a smart investment.\n\n## Top 5 Value-Adding Green Upgrades\n\n### 1. Solar Panels (ROI: 10-15 years)\nSolar panel costs have dropped significantly. A typical 4kW system costs £5,000-8,000 and can save £800-1,000 per year on energy bills. Plus, you can sell excess energy back to the grid.\n\n### 2. Heat Pump Installation (ROI: 7-12 years)\nAir source heat pumps are eligible for the Boiler Upgrade Scheme grant of £7,500. They're 3-4x more efficient than gas boilers and can add £10,000-15,000 to your property value.\n\n### 3. EPC Improvements\nMoving from an EPC rating of D to C can add 5-10% to your property value. Focus on loft insulation (£300-500), cavity wall insulation (£500-1,500), and draught-proofing.\n\n### 4. Double or Triple Glazing\nReplacing single glazing with double glazing can save £100-200 per year and significantly improve comfort. Triple glazing is worth considering for north-facing rooms.\n\n### 5. Smart Home Energy Management\nSmart thermostats, automated lighting, and energy monitoring systems appeal to tech-savvy buyers and typically cost £200-500 to install.\n\n## The EPC Factor\n\nFrom 2028, all rental properties will need a minimum EPC rating of C. Landlords should start planning upgrades now to avoid compliance issues and potential penalties.",
  },
  {
    slug: "finding-trusted-tradesperson",
    title: "How to Find a Trusted Tradesperson in 2026",
    excerpt: "From verification checks to reading reviews, here's how to find reliable professionals for your home projects.",
    category: "Advice",
    author: { name: "Emma Richards", avatar: "/images/agents/agent-3.jpg", role: "Property Analyst" },
    date: "2026-02-05",
    readTime: "7 min read",
    image: "/images/blog/blog-1.jpg",
    content: "Finding a reliable tradesperson can feel like a minefield. Here's how to protect yourself and find the right professional.\n\n## The Britestate Verification Standard\n\nEvery tradesperson on Britestate undergoes our rigorous verification process: identity checks, insurance verification, qualification validation, and 3 client + 3 peer references. This means you can book with confidence.\n\n## Red Flags to Watch For\n\n- Demands cash-only payment\n- No written quote or contract\n- Pressures you to decide immediately\n- Can't provide references\n- Unusually low quotes\n\n## Getting Quotes Right\n\nAlways get at least 3 quotes for any job over £500. Make sure each quote covers the same scope of work so you can compare fairly. The cheapest isn't always the best — look at reviews, qualifications, and how professional their communication is.",
  },
  {
    slug: "stamp-duty-guide-2026",
    title: "Stamp Duty Land Tax: Complete Guide for 2026",
    excerpt: "Everything you need to know about stamp duty rates, exemptions, and how to calculate what you'll pay.",
    category: "Legal",
    author: { name: "Sarah Thompson", avatar: "/images/agents/agent-2.jpg", role: "Senior Editor" },
    date: "2026-01-30",
    readTime: "10 min read",
    image: "/images/blog/blog-2.jpg",
    content: "Stamp Duty Land Tax (SDLT) is a tax paid when you buy property or land in England and Northern Ireland above a certain price.\n\n## Current Rates (2026)\n\n| Property Price Band | Rate |\n|---|---|\n| Up to £250,000 | 0% |\n| £250,001 - £925,000 | 5% |\n| £925,001 - £1,500,000 | 10% |\n| Over £1,500,000 | 12% |\n\n## First-Time Buyer Relief\n\nFirst-time buyers pay no stamp duty on the first £425,000 of a property priced up to £625,000. This can save up to £8,750.\n\n## Additional Property Surcharge\n\nBuying a second home or buy-to-let? You'll pay an additional 3% on top of standard rates. On a £300,000 property, that's an extra £9,000.\n\n## Use Our Calculator\n\nTry Britestate's free stamp duty calculator to see exactly what you'll pay. Just enter your property price and buyer type for an instant breakdown.",
  },
  {
    slug: "landlord-compliance-checklist",
    title: "Landlord Compliance Checklist: Stay Legal in 2026",
    excerpt: "From gas safety certificates to deposit protection, ensure you meet every legal requirement as a UK landlord.",
    category: "Landlord Tips",
    author: { name: "Tom Bradley", avatar: "/images/agents/agent-1.jpg", role: "Property Writer" },
    date: "2026-01-22",
    readTime: "9 min read",
    image: "/images/blog/blog-3.jpg",
    content: "UK landlord regulations continue to evolve. Here's your complete compliance checklist for 2026.\n\n## Essential Certificates\n\n### Gas Safety Certificate (CP12)\n- **Required:** Annually\n- **Cost:** £60-90\n- Must be carried out by a Gas Safe registered engineer\n\n### Energy Performance Certificate (EPC)\n- **Required:** Valid for 10 years, minimum E rating (C from 2028)\n- **Cost:** £60-120\n\n### Electrical Installation Condition Report (EICR)\n- **Required:** Every 5 years\n- **Cost:** £150-300\n\n### Smoke and CO Alarms\n- Smoke alarms on every floor, CO alarms in rooms with solid fuel appliances\n- Test at the start of each tenancy\n\n## Deposit Protection\n\nYou must protect tenants' deposits in a government-approved scheme within 30 days. Failure to do so can result in penalties of 1-3x the deposit amount.\n\n## Right to Rent Checks\n\nVerify every adult tenant's right to rent in England before the tenancy starts. Keep copies of documents for at least one year after the tenancy ends.\n\nUse Britestate's compliance dashboard to track all certificates, set reminders, and find verified professionals for inspections.",
  },
  {
    slug: "best-areas-remote-workers-2026",
    title: "Best UK Areas for Remote Workers: Space, Speed & Value",
    excerpt: "Where to find the perfect balance of fast broadband, affordable housing, and quality of life outside the city.",
    category: "Market Trends",
    author: { name: "Emma Richards", avatar: "/images/agents/agent-3.jpg", role: "Property Analyst" },
    date: "2026-01-15",
    readTime: "8 min read",
    image: "/images/blog/blog-1.jpg",
    content: "Remote working has permanently changed where people choose to live. Here are the top areas combining fast broadband, affordability, and lifestyle.\n\n## Our Top 5 Picks\n\n### 1. Frome, Somerset\nAverage price: £325,000. Fibre broadband available. Creative community, independent shops, and the stunning Mendip Hills on your doorstep.\n\n### 2. Hebden Bridge, West Yorkshire\nAverage price: £250,000. Full fibre broadband. A vibrant arts scene, excellent walking, and just 40 minutes from Manchester by train.\n\n### 3. Margate, Kent\nAverage price: £275,000. Superfast broadband widely available. Beach lifestyle, Turner Contemporary gallery, and high-speed rail to London St Pancras in 76 minutes.\n\n### 4. Shrewsbury, Shropshire\nAverage price: £280,000. Good connectivity. A beautiful medieval town with excellent schools, riverside walks, and a thriving food scene.\n\n### 5. Stroud, Gloucestershire\nAverage price: £350,000. Fibre broadband expanding. Cotswolds location, famous farmers' market, and a strong community of creative professionals.",
  },
  {
    slug: "mortgage-guide-self-employed",
    title: "Getting a Mortgage When Self-Employed: A Practical Guide",
    excerpt: "Self-employed? Here's how to improve your chances of mortgage approval and what lenders actually look for.",
    category: "Buying Guide",
    author: { name: "Sarah Thompson", avatar: "/images/agents/agent-2.jpg", role: "Senior Editor" },
    date: "2026-01-08",
    readTime: "7 min read",
    image: "/images/blog/blog-2.jpg",
    content: "Getting a mortgage when you're self-employed isn't as difficult as you might think — but it does require more preparation.\n\n## What Lenders Want to See\n\n1. **2-3 years of accounts or tax returns** — SA302 forms from HMRC are essential\n2. **A stable or growing income** — Lenders average your last 2-3 years of income\n3. **A good credit score** — Check yours before applying and fix any issues\n4. **A reasonable deposit** — 10-15% is typical; some lenders accept 5%\n\n## Tips for Improving Your Chances\n\n- Keep business and personal finances separate\n- File your tax returns early\n- Avoid taking large dividends one year and small the next\n- Work with a mortgage broker who specialises in self-employed applicants\n\nBritestate connects you with verified mortgage brokers who understand self-employed income. Use our 'Find a Broker' tool to compare options.",
  },
  {
    slug: "property-renovation-planning-permission",
    title: "Do You Need Planning Permission? A Homeowner's Guide",
    excerpt: "From loft conversions to garden offices, understand when you need planning permission and when permitted development applies.",
    category: "Advice",
    author: { name: "Tom Bradley", avatar: "/images/agents/agent-1.jpg", role: "Property Writer" },
    date: "2026-01-02",
    readTime: "6 min read",
    image: "/images/blog/blog-3.jpg",
    content: "Planning to extend or renovate? Understanding when you need planning permission can save you time, money, and legal headaches.\n\n## Permitted Development (No Planning Needed)\n\n- Single-storey rear extensions up to 3m (semi) or 4m (detached)\n- Loft conversions up to 40m³ (terraced/semi) or 50m³ (detached)\n- Garden offices under 2.5m height near a boundary\n- Internal alterations (non-listed buildings)\n- Solar panels (with conditions)\n\n## You WILL Need Planning Permission For\n\n- Extensions exceeding permitted development limits\n- Building in front of the principal elevation\n- Any work in a Conservation Area beyond basic maintenance\n- Listed building alterations (even internal)\n- Change of use (e.g., residential to commercial)\n\n## The Application Process\n\n1. Pre-application advice (optional but recommended): £50-600\n2. Submit application via Planning Portal: £234 for householder applications\n3. Wait for decision: typically 8 weeks\n4. Appeal if refused: free, but takes 6+ months\n\nNeed an architect or planning consultant? Find verified professionals on Britestate.",
  },
];
